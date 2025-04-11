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
	}, {
		sequelize,
		timestamps: true,
		modelName: 'User',
	})

	return User;
};