const { Sequelize, DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
	class LeaderboardPlayer extends Model { }

	LeaderboardPlayer.init({
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
		modelName: 'LeaderboardPlayer',
	})

	return LeaderboardPlayer;
};