import bcrypt from "bcrypt";
import { DataTypes } from "sequelize";

export default function defineAccountModel(sequelize) {
  const Account = sequelize.define(
    "Account",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING(120),
        allowNull: false,
        unique: true,
      },
      password: {
        type: DataTypes.STRING(60),
        allowNull: false,
      },
      username: {
        type: DataTypes.STRING(15),
        allowNull: false,
      },
      person: {
        type: DataTypes.JSONB,
        allowNull: false,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      roleId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "roles",
          key: "id",
        },
      },
    },
    {
      tableName: "accounts",
      timestamps: false,
      hooks: {
        beforeCreate: async (account) => {
          account.password = await bcrypt.hash(account.password, 10);
        },
        beforeUpdate: async (account) => {
          if (account.changed("password")) {
            account.password = await bcrypt.hash(account.password, 10);
          }
        },
      },
    },
  );

  Account.prototype.comparePassword = function comparePassword(password) {
    return bcrypt.compare(password, this.password);
  };

  return Account;
}