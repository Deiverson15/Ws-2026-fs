import { DataTypes } from "sequelize";

export default function defineRoleModel(sequelize) {
  return sequelize.define(
    "Role",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING(30),
        allowNull: false,
        unique: true,
      },
      description: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      menu: {
        type: DataTypes.JSONB,
        allowNull: false,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    },
    {
      tableName: "roles",
      timestamps: false,
    },
  );
}