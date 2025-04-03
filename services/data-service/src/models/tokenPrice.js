import { Model, DataTypes } from 'sequelize';

export default class TokenPrice extends Model {
  static init(sequelize) {
    return super.init(
      {
        timestamp: {
          type: DataTypes.DATE,
          allowNull: false,
          primaryKey: true,
        },
        token_symbol: {
          type: DataTypes.TEXT,
          primaryKey: true,
          references: {
            model: 'tokens',
            key: 'token_symbol',
          },
        },
        price_usd: {
          type: DataTypes.DECIMAL(18, 6),
          allowNull: false,
        },
      },
      {
        sequelize,
        modelName: 'TokenPrice',
        tableName: 'token_prices',
        timestamps: false,
      },
    );
  }
}
