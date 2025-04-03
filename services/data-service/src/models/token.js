import { Model, DataTypes } from 'sequelize';

export default class Token extends Model {
  static init(sequelize) {
    return super.init(
      {
        token_symbol: {
          type: DataTypes.TEXT,
          primaryKey: true,
        },
      },
      {
        sequelize,
        modelName: 'Token',
        tableName: 'tokens',
        timestamps: false,
      },
    );
  }
}
