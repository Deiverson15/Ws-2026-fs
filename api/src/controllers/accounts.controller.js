import {
  ForeignKeyConstraintError,
  UniqueConstraintError,
  ValidationError,
} from "sequelize";
import { sendEmail } from "../general/sendMail.js";

const editableFields = ["email", "password", "username", "person", "roleId"];

function publicAccount(account) {
  const data = account.get({ plain: true });
  delete data.password;
  return data;
}

function validateAccountData(data, { partial = false } = {}) {
  const fields = ["email", "password", "username", "person", "roleId"];

  if (!partial && fields.some((field) => data[field] === undefined)) {
    return "Se requieren email, password, username, person y roleId.";
  }

  if (data.email !== undefined && (
    typeof data.email !== "string" ||
    data.email.trim().length === 0 ||
    data.email.length > 120
  )) {
    return "email debe ser texto de hasta 120 caracteres.";
  }

  if (data.password !== undefined && (
    typeof data.password !== "string" ||
    data.password.length === 0 ||
    Buffer.byteLength(data.password, "utf8") > 72
  )) {
    return "password debe ser texto de hasta 72 bytes.";
  }

  if (data.username !== undefined && (
    typeof data.username !== "string" ||
    data.username.trim().length === 0 ||
    data.username.length > 15
  )) {
    return "username debe ser texto de hasta 15 caracteres.";
  }

  if (data.person !== undefined && (
    data.person === null ||
    typeof data.person !== "object" ||
    Array.isArray(data.person)
  )) {
    return "person debe ser un objeto JSON.";
  }

  if (data.roleId !== undefined && (
    !Number.isInteger(data.roleId) ||
    data.roleId < 1
  )) {
    return "roleId debe ser un entero positivo.";
  }

  return null;
}

function respondWithAccountError(res, error, operation) {
  if (error instanceof UniqueConstraintError) {
    return res.status(409).json({ message: "Ya existe una cuenta con ese email." });
  }

  if (error instanceof ForeignKeyConstraintError) {
    return res.status(400).json({ message: "roleId no corresponde a un rol existente." });
  }

  if (error instanceof ValidationError) {
    return res.status(400).json({ message: "Los datos de la cuenta no son válidos." });
  }

  console.error(`Error al ${operation}:`, error);
  return res.status(500).json({ message: `No se pudo ${operation} la cuenta.` });
}

function parseAccountId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function getDependencies(req, res) {
  const Account = req.app?.locals?.models?.Account;
  const emailSender = req.app?.locals?.emailSender ?? sendEmail;

  if (!Account) {
    console.error("No se configuró el modelo Account en app.locals.models.");
    res.status(500).json({ message: "El modelo de cuentas no está configurado." });
    return null;
  }

  return { Account, emailSender };
}

export async function register(req, res) {
  const data = req.body ?? {};
  const validationMessage = validateAccountData(data);

  if (validationMessage) {
    return res.status(400).json({ message: validationMessage });
  }

  const dependencies = getDependencies(req, res);
  if (!dependencies) {
    return;
  }
  const { Account, emailSender } = dependencies;

  let account;
  try {
    account = await Account.create({
      email: data.email.trim(),
      password: data.password,
      username: data.username.trim(),
      person: data.person,
      roleId: data.roleId,
      isActive: false,
    });
  } catch (error) {
    return respondWithAccountError(res, error, "crear");
  }

  try {
    await emailSender({
      to: account.email,
      subject: "Registro completado",
      text: `Hola ${account.username}, tu cuenta fue registrada y está pendiente de activación.`,
    });
  } catch (error) {
    console.error("La cuenta fue creada, pero no se pudo enviar el correo:", error);
    return res.status(502).json({
      message: "La cuenta fue creada, pero no se pudo enviar el correo.",
      account: publicAccount(account),
    });
  }

  return res.status(201).json({
    message: "Cuenta creada y correo enviado correctamente.",
    account: publicAccount(account),
  });
}

export async function getList(req, res) {
  const dependencies = getDependencies(req, res);
  if (!dependencies) {
    return;
  }

  try {
    const accounts = await dependencies.Account.findAll({
      attributes: { exclude: ["password"] },
    });
    return res.status(200).json(accounts);
  } catch (error) {
    return respondWithAccountError(res, error, "obtener");
  }
}

export async function update(req, res) {
  const id = parseAccountId(req.params.id);
  if (id === null) {
    return res.status(400).json({ message: "El id de la cuenta no es válido." });
  }

  const body = req.body ?? {};
  const updates = Object.fromEntries(
    editableFields
      .filter((field) => Object.hasOwn(body, field))
      .map((field) => [field, body[field]]),
  );

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ message: "No hay campos válidos para actualizar." });
  }

  const validationMessage = validateAccountData(updates, { partial: true });
  if (validationMessage) {
    return res.status(400).json({ message: validationMessage });
  }

  const dependencies = getDependencies(req, res);
  if (!dependencies) {
    return;
  }

  try {
    const account = await dependencies.Account.findByPk(id);
    if (!account) {
      return res.status(404).json({ message: "Cuenta no encontrada." });
    }

    account.set({
      ...updates,
      ...(updates.email && { email: updates.email.trim() }),
      ...(updates.username && { username: updates.username.trim() }),
    });
    await account.save();

    return res.status(200).json({
      message: "Cuenta actualizada correctamente.",
      account: publicAccount(account),
    });
  } catch (error) {
    return respondWithAccountError(res, error, "actualizar");
  }
}

export async function activate(req, res) {
  const id = parseAccountId(req.params.id);
  if (id === null) {
    return res.status(400).json({ message: "El id de la cuenta no es válido." });
  }

  const dependencies = getDependencies(req, res);
  if (!dependencies) {
    return;
  }

  try {
    const account = await dependencies.Account.findByPk(id);
    if (!account) {
      return res.status(404).json({ message: "Cuenta no encontrada." });
    }

    if (!account.isActive) {
      account.isActive = true;
      await account.save();
    }

    return res.status(200).json({
      message: "Cuenta activada correctamente.",
      account: publicAccount(account),
    });
  } catch (error) {
    return respondWithAccountError(res, error, "activar");
  }
}