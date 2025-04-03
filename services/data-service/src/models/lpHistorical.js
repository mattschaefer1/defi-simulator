import { Model, DataTypes } from 'sequelize';

export default class LPHistorical extends Model {
  static init(sequelize) {
    return super.init(
      {
        timestamp: {
          type: DataTypes.DATE,
          allowNull: false,
          primaryKey: true,
        },
        pool_address: {
          type: DataTypes.TEXT,
          primaryKey: true,
          references: {
            model: 'pools',
            key: 'pool_address',
          },
        },
        tvl_usd: {
          type: DataTypes.DECIMAL(18, 6),
        },
        volume_24h_usd: {
          type: DataTypes.DECIMAL(18, 6),
        },
        fees_24h_usd: {
          type: DataTypes.DECIMAL(18, 6),
        },
      },
      {
        sequelize,
        modelName: 'LPHistorical',
        tableName: 'lp_historical',
        timestamps: false,
      },
    );
  }
}
