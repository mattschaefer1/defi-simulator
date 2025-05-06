import { Sequelize, DataTypes } from 'sequelize';
import { models, sequelize } from '../../../src/models/index.js';

describe('Sequelize Models', () => {
  describe('Sequelize Instance', () => {
    it('should be initialized correctly', () => {
      expect(sequelize).toBeInstanceOf(Sequelize);
      expect(sequelize.options.dialect).toBe('postgres');
      expect(sequelize.options.logging).toBe(false);
    });
  });

  describe('Token Model', () => {
    it('should have correct field definitions', () => {
      const { Token } = models;
      expect(Token.tableName).toBe('tokens');
      expect(Token.options.timestamps).toBe(false);
      expect(Token.getAttributes()).toHaveProperty('token_symbol');
      expect(Token.getAttributes().token_symbol.type).toBeInstanceOf(
        DataTypes.TEXT,
      );
      expect(Token.getAttributes().token_symbol.primaryKey).toBe(true);
      expect(Token.primaryKeyAttributes).toEqual(['token_symbol']);
    });

    it('should have two hasMany associations with Pool', () => {
      const { Token } = models;
      const hasManyAssociations = Object.values(Token.associations).filter(
        (assoc) =>
          assoc.associationType === 'HasMany' && assoc.target.name === 'Pool',
      );
      expect(hasManyAssociations.length).toBe(2);
      const foreignKeys = hasManyAssociations.map((assoc) => assoc.foreignKey);
      expect(foreignKeys).toContain('token0_symbol');
      expect(foreignKeys).toContain('token1_symbol');
    });

    it('should have one hasMany association with TokenPrice', () => {
      const { Token } = models;
      const hasManyAssociations = Object.values(Token.associations).filter(
        (assoc) =>
          assoc.associationType === 'HasMany' &&
          assoc.target.name === 'TokenPrice',
      );
      expect(hasManyAssociations.length).toBe(1);
      expect(hasManyAssociations[0].foreignKey).toBe('token_symbol');
    });
  });

  describe('Pool Model', () => {
    it('should have correct field definitions', () => {
      const { Pool } = models;
      expect(Pool.tableName).toBe('pools');
      expect(Pool.options.timestamps).toBe(false);
      expect(Pool.getAttributes()).toHaveProperty('pool_address');
      expect(Pool.getAttributes().pool_address.type).toBeInstanceOf(
        DataTypes.TEXT,
      );
      expect(Pool.getAttributes().pool_address.primaryKey).toBe(true);
      expect(Pool.getAttributes()).toHaveProperty('token0_symbol');
      expect(Pool.getAttributes().token0_symbol.type).toBeInstanceOf(
        DataTypes.TEXT,
      );
      expect(Pool.getAttributes().token0_symbol.references.model).toBe(
        'tokens',
      );
      expect(Pool.getAttributes().token0_symbol.references.key).toBe(
        'token_symbol',
      );
      expect(Pool.getAttributes()).toHaveProperty('token1_symbol');
      expect(Pool.getAttributes().token1_symbol.type).toBeInstanceOf(
        DataTypes.TEXT,
      );
      expect(Pool.getAttributes().token1_symbol.references.model).toBe(
        'tokens',
      );
      expect(Pool.getAttributes().token1_symbol.references.key).toBe(
        'token_symbol',
      );
      expect(Pool.primaryKeyAttributes).toEqual(['pool_address']);
    });

    it('should have two belongsTo associations with Token', () => {
      const { Pool } = models;
      const belongsToAssociations = Object.values(Pool.associations).filter(
        (assoc) =>
          assoc.associationType === 'BelongsTo' &&
          assoc.target.name === 'Token',
      );
      expect(belongsToAssociations.length).toBe(2);
      const foreignKeys = belongsToAssociations.map(
        (assoc) => assoc.foreignKey,
      );
      expect(foreignKeys).toContain('token0_symbol');
      expect(foreignKeys).toContain('token1_symbol');
    });

    it('should have one hasMany association with LPHistorical', () => {
      const { Pool } = models;
      const hasManyAssociations = Object.values(Pool.associations).filter(
        (assoc) =>
          assoc.associationType === 'HasMany' &&
          assoc.target.name === 'LPHistorical',
      );
      expect(hasManyAssociations.length).toBe(1);
      expect(hasManyAssociations[0].foreignKey).toBe('pool_address');
    });
  });

  describe('TokenPrice Model', () => {
    it('should have correct field definitions', () => {
      const { TokenPrice } = models;
      expect(TokenPrice.tableName).toBe('token_prices');
      expect(TokenPrice.options.timestamps).toBe(false);
      expect(TokenPrice.getAttributes()).toHaveProperty('timestamp');
      expect(TokenPrice.getAttributes().timestamp.type).toBeInstanceOf(
        DataTypes.DATE,
      );
      expect(TokenPrice.getAttributes().timestamp.primaryKey).toBe(true);
      expect(TokenPrice.getAttributes().timestamp.allowNull).toBe(false);
      expect(TokenPrice.getAttributes()).toHaveProperty('token_symbol');
      expect(TokenPrice.getAttributes().token_symbol.type).toBeInstanceOf(
        DataTypes.TEXT,
      );
      expect(TokenPrice.getAttributes().token_symbol.primaryKey).toBe(true);
      expect(TokenPrice.getAttributes().token_symbol.references.model).toBe(
        'tokens',
      );
      expect(TokenPrice.getAttributes().token_symbol.references.key).toBe(
        'token_symbol',
      );
      expect(TokenPrice.getAttributes()).toHaveProperty('price_usd');
      expect(TokenPrice.getAttributes().price_usd.type).toEqual(
        DataTypes.DECIMAL(18, 6),
      );
      expect(TokenPrice.getAttributes().price_usd.allowNull).toBe(false);
      expect(TokenPrice.primaryKeyAttributes).toEqual([
        'timestamp',
        'token_symbol',
      ]);
    });

    it('should have belongsTo association with Token', () => {
      const { TokenPrice } = models;
      expect(TokenPrice.associations).toHaveProperty('Token');
      const association = TokenPrice.associations.Token;
      expect(association.associationType).toBe('BelongsTo');
      expect(association.target.name).toBe('Token');
      expect(association.foreignKey).toBe('token_symbol');
    });
  });

  describe('LPHistorical Model', () => {
    it('should have correct field definitions', () => {
      const { LPHistorical } = models;
      expect(LPHistorical.tableName).toBe('lp_historical');
      expect(LPHistorical.options.timestamps).toBe(false);
      expect(LPHistorical.getAttributes()).toHaveProperty('timestamp');
      expect(LPHistorical.getAttributes().timestamp.type).toBeInstanceOf(
        DataTypes.DATE,
      );
      expect(LPHistorical.getAttributes().timestamp.primaryKey).toBe(true);
      expect(LPHistorical.getAttributes().timestamp.allowNull).toBe(false);
      expect(LPHistorical.getAttributes()).toHaveProperty('pool_address');
      expect(LPHistorical.getAttributes().pool_address.type).toBeInstanceOf(
        DataTypes.TEXT,
      );
      expect(LPHistorical.getAttributes().pool_address.primaryKey).toBe(true);
      expect(LPHistorical.getAttributes().pool_address.references.model).toBe(
        'pools',
      );
      expect(LPHistorical.getAttributes().pool_address.references.key).toBe(
        'pool_address',
      );
      expect(LPHistorical.getAttributes()).toHaveProperty('tvl_usd');
      expect(LPHistorical.getAttributes().tvl_usd.type).toEqual(
        DataTypes.DECIMAL(18, 6),
      );
      expect(LPHistorical.getAttributes()).toHaveProperty('volume_24h_usd');
      expect(LPHistorical.getAttributes().volume_24h_usd.type).toEqual(
        DataTypes.DECIMAL(18, 6),
      );
      expect(LPHistorical.getAttributes()).toHaveProperty('fees_24h_usd');
      expect(LPHistorical.getAttributes().fees_24h_usd.type).toEqual(
        DataTypes.DECIMAL(18, 6),
      );
      expect(LPHistorical.primaryKeyAttributes).toEqual([
        'timestamp',
        'pool_address',
      ]);
    });

    it('should have belongsTo association with Pool', () => {
      const { LPHistorical } = models;
      expect(LPHistorical.associations).toHaveProperty('Pool');
      const association = LPHistorical.associations.Pool;
      expect(association.associationType).toBe('BelongsTo');
      expect(association.target.name).toBe('Pool');
      expect(association.foreignKey).toBe('pool_address');
    });
  });

  describe('ETHStakingHistorical Model', () => {
    it('should have correct field definitions', () => {
      const { ETHStakingHistorical } = models;
      expect(ETHStakingHistorical.tableName).toBe('eth_staking_historical');
      expect(ETHStakingHistorical.options.timestamps).toBe(false);
      expect(ETHStakingHistorical.getAttributes()).toHaveProperty('timestamp');
      expect(
        ETHStakingHistorical.getAttributes().timestamp.type,
      ).toBeInstanceOf(DataTypes.DATE);
      expect(ETHStakingHistorical.getAttributes().timestamp.primaryKey).toBe(
        true,
      );
      expect(ETHStakingHistorical.getAttributes()).toHaveProperty(
        'apy_percentage',
      );
      expect(ETHStakingHistorical.getAttributes().apy_percentage.type).toEqual(
        DataTypes.DECIMAL(5, 2),
      );
      expect(ETHStakingHistorical.primaryKeyAttributes).toEqual(['timestamp']);
    });
  });
});
