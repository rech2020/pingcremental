const { Sequelize, DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
	class User extends Model {}

	User.init({
		userId: {
			type: DataTypes.STRING,
			primaryKey: true,
		},

		score: {
			type: DataTypes.NUMBER,
			defaultValue: 0,
			allowNull: false,
		},

		clicks: {
			type: DataTypes.NUMBER,
			defaultValue: 0,
			allowNull: false,
		},
		
		upgrades: {
			type: DataTypes.JSON,
			allowNull: false,
			defaultValue: {},
		},

		totalScore: {
			type: DataTypes.NUMBER,
			defaultValue: 0,
			allowNull: false,
		},

		// prestige data
		bp: {
			type: DataTypes.NUMBER,
			defaultValue: 0,
			allowNull: false,
		},
		prestigeUpgrades: {
			type: DataTypes.JSON,
			allowNull: false,
			defaultValue: {},
		},

		// slumber upgrade
		lastPing: {
			type: DataTypes.DATE,
			defaultValue: Date.now(),
			allowNull: false,
		},
		slumberClicks: {
			type: DataTypes.NUMBER,
			defaultValue: 0,
			allowNull: false,
		},

		// glimmer upgrade
		glimmerClicks: {
			type: DataTypes.NUMBER,
			defaultValue: 0,
			allowNull: false,
		}

	}, {
		sequelize,
		timestamps: true,
		modelName: 'User',
	})

	return User;
};