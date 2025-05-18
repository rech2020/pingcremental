const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
    class Badge extends Model { }

    Badge.init({
        dbId: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },

        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },

        description: {
            type: DataTypes.STRING,
            allowNull: false,
        },

        flavorText: {  
            type: DataTypes.STRING,
            allowNull: false,
        },

        emoji: {
            type: DataTypes.STRING,
            allowNull: false,
        },

        tier: {
            // 1 = silver, 2 = blue, 3 = purple
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1,
            validate: {
                isIn: {
                    args: [[1, 2, 3]],
                    msg: 'badge tier must be from 1-3',
                },
            },
        }
    }, {
        sequelize,
        timestamps: true,
        modelName: 'Badge',
    })

    return Badge;
};