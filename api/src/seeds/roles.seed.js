export default async function seedRoles({ Role }) {
  const roles = [
    {
      name: "admin",
      description: "Administrador",
      menu: [],
      isActive: true,
    },
    {
      name: "vendedor",
      description: "Vendedor",
      menu: [],
      isActive: true,
    },
    {
      name: "cliente",
      description: "Cliente",
      menu: [],
      isActive: true,
    },
  ];

  for (const role of roles) {
    await Role.findOrCreate({
      where: { name: role.name },
      defaults: role,
    });
  }
}

export async function down({ Role }) {
  await Role.destroy({
    where: {
      name: ["admin", "vendedor", "cliente"],
    },
  });
}