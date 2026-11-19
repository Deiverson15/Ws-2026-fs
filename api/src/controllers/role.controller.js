function parseRoleId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function getRoleModel(req, res) {
  const Role = req.app?.locals?.models?.Role;

  if (!Role) {
    console.error("No se configuró el modelo Role en app.locals.models.");
    res.status(500).json({ message: "El modelo de roles no está configurado." });
    return null;
  }

  return Role;
}

async function setRoleActive(req, res, isActive) {
  const id = parseRoleId(req.params.id);
  if (id === null) {
    return res.status(400).json({ message: "El id del rol no es válido." });
  }

  const Role = getRoleModel(req, res);
  if (!Role) {
    return;
  }

  try {
    const role = await Role.findByPk(id);
    if (!role) {
      return res.status(404).json({ message: "Rol no encontrado." });
    }

    if (role.isActive !== isActive) {
      role.isActive = isActive;
      await role.save();
    }

    return res.status(200).json({
      message: `Rol ${isActive ? "activado" : "desactivado"} correctamente.`,
      role,
    });
  } catch (error) {
    console.error(`Error al ${isActive ? "activar" : "desactivar"} el rol:`, error);
    return res.status(500).json({
      message: `No se pudo ${isActive ? "activar" : "desactivar"} el rol.`,
    });
  }
}

export async function activate(req, res) {
  return setRoleActive(req, res, true);
}

export async function deactivate(req, res) {
  return setRoleActive(req, res, false);
}