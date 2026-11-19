import "dotenv/config";
import jwt from "jsonwebtoken";

export async function login(req, res) {
  const { email, password } = req.body ?? {};

  if (
    typeof email !== "string" ||
    email.trim().length === 0 ||
    typeof password !== "string" ||
    password.length === 0 ||
    Buffer.byteLength(password, "utf8") > 72
  ) {
    return res.status(400).json({
      message: "Se requieren un email válido y una contraseña de hasta 72 bytes.",
    });
  }

  const secret = process.env.JWT_SECRET;
  if (!secret || Buffer.byteLength(secret, "utf8") < 32) {
    console.error("JWT_SECRET debe estar configurada y tener al menos 32 bytes.");
    return res.status(500).json({ message: "La autenticación no está configurada." });
  }

  const Account = req.app?.locals?.models?.Account;
  if (!Account) {
    console.error("No se configuró el modelo Account en app.locals.models.");
    return res.status(500).json({ message: "El modelo de cuentas no está configurado." });
  }

  try {
    const account = await Account.findOne({ where: { email: email.trim() } });

    if (!account || !(await account.comparePassword(password))) {
      return res.status(401).json({ message: "Email o contraseña incorrectos." });
    }

    if (!account.isActive) {
      return res.status(403).json({ message: "La cuenta no está activada." });
    }

    const token = jwt.sign(
      { roleId: account.roleId },
      secret,
      {
        algorithm: "HS256",
        expiresIn: "1h",
        subject: String(account.id),
      },
    );

    const accountData = account.get({ plain: true });
    delete accountData.password;

    return res.status(200).json({
      message: "Inicio de sesión correcto.",
      token,
      account: accountData,
    });
  } catch (error) {
    console.error("Error al iniciar sesión:", error);
    return res.status(500).json({ message: "No se pudo iniciar sesión." });
  }
}