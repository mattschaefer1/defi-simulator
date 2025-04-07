import { Model, DataTypes } from 'sequelize';

export default class Pool extends Model {
  static init(sequelize) {
    return super.init(
      {
        pool_address: {
          type: DataTypes.TEXT,
          primaryKey: true,
        },
        token0_symbol: {
          type: DataTypes.TEXT,
          references: {
            model: 'tokens',
            key: 'token_symbol',
          },
        },
        token1_symbol: {
          type: DataTypes.TEXT,
          references: {
            model: 'tokens',
            key: 'token_symbol',
          },
        },
      },
      {
        sequelize,
        modelName: 'Pool',
        tableName: 'pools',
        timestamps: false,
      },
    );
  }
}
