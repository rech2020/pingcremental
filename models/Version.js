const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
    class Version extends Model { }

    Version.init({
        verNum: {
            type: DataTypes.STRING,
            unique: true,
            allowNull: false,
            validate: {
                is: {
                    args: /^\d+\.\d+\.\d+h*\d*$/,
                    msg: 'version number must be in the format W.X.YhZ (e.g. 1.0.0, 1.0.0h1)',
                },
            },
        },

        dbId: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
        },

        importance: {
            type: DataTypes.ENUM('major', 'minor', 'patch', 'hotfix'),
            allowNull: false,
        },

        description: {
            type: DataTypes.STRING,
            allowNull: false,
        },

        releasedAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
    }, {
        sequelize,
        timestamps: true,
        modelName: 'Version',
    })

    return Version;
};