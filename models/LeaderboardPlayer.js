const { Sequelize, DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
	class LeaderboardUser extends Model {}

	LeaderboardUser.init({
		userId: {
			type: DataTypes.STRING,
			primaryKey: true,
		},

		score: {
			type: DataTypes.NUMBER,
			defaultValue: 0,
			allowNull: false,
		},

		position: {
			type: DataTypes.NUMBER,
			defaultValue: 0,
			allowNull: false,
		},

	}, {
		sequelize,
		timestamps: true,
		modelName: 'LeaderboardUser',
	})

	return LeaderboardUser;
};