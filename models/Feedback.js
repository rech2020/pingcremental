const { Sequelize, DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
    class Feedback extends Model { }

    Feedback.init({
        dbId: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },

        type: {
            type: DataTypes.ENUM('bug', 'upgrade', 'balancing', 'other'),
            allowNull: false,
        },

        text: {
            type: DataTypes.STRING,
            allowNull: false,
        },

        userId: {
            type: DataTypes.STRING,
            allowNull: false,
        },
    }, {
        sequelize,
        timestamps: true,
        modelName: 'Feedback',
    })

    return Feedback;
};