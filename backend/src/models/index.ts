import { Sequelize } from 'sequelize-typescript';
import { FileModel } from './file.model';
import { TestResultsModel } from './testResults.model';
import { TestDetailsModel } from './testDetails.model';

export const sequelize = new Sequelize({
    dialect: 'postgres',
    host: process.env.POSTGRES_HOST,
    database: process.env.POSTGRES_DB,
    username: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    models: [FileModel, TestResultsModel, TestDetailsModel],
    logging: false,
});