import { Model, DataTypes } from 'sequelize';

export default class ETHStakingHistorical extends Model {
  static init(sequelize) {
    return super.init(
      {
        timestamp: {
          type: DataTypes.DATE,
          primaryKey: true,
        },
        apy_percentage: {
          type: DataTypes.DECIMAL(5, 2),
        },
      },
      {
        sequelize,
        modelName: 'ETHStakingHistorical',
        tableName: 'eth_staking_historical',
        timestamps: false,
      },
    );
  }
}
