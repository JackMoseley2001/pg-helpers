// Imports
const pg = require('pg');
const fs = require('fs');
const path = require('path');

/**
 * @typedef SQLFormatOptions
 * @property {String} file
 * @property {Object} additionalQueries
 * @property {Object} parameters
 */

/**
 * @typedef FormattedSQL
 * @property {String} sql
 * @property {Array} parameters
 */

class Database {
  /**
   * @type {pg.Pool}
   */
  db;
  _sqlRoot;

  /**
   * @param {pg.PoolConfig} options
   * @param {String} sqlRoot
   */
  constructor(options, sqlRoot) {
    this.db = new pg.Pool(options);
    this._sqlRoot = sqlRoot;
  }

  async deinit() {
    await this.db.end();
  }

  /**
   * @param {String} filePath
   */
  _getSQLFile(filePath) {
    const fileName = filePath.replace(/\\./g, '/') + '.sql';

    const file = fs.readFileSync(path.join(this._sqlRoot, fileName), {
      encoding: 'utf8'
    });
    if (file.trim().length === 0) throw new Error('SQL file was found empty');
    const sql = file.split('\n').join(' ');
    return sql;
  }

  /**
   * @param {String} str
   * @param {String} find
   * @param {String} replaceVal
   */
  _findAndReplaceAll(str, find, replaceVal) {
    const findKey = `:${find}`;
    const findRegex = new RegExp(findKey, 'g');
    if (str.includes(findKey)) {
      str = str.replace(findRegex, replaceVal);
    }
    return str;
  }

  /**
   * @param {String} sql
   * @param {Object} queries
   */
  _includeAdditionalQueries(sql, queries) {
    Object.entries(queries).forEach(([key, value]) => {
      sql = this._findAndReplaceAll(sql, key, value);
    });
    return sql;
  }

  /**
   * @param {String} sql
   * @param {Object} parameters
   */
  _includeParameters(sql, parameters) {
    let paramCount = 1;
    const values = [];
    Object.entries(parameters).forEach(([key, value]) => {
      sql = this._findAndReplaceAll(sql, key, `$${paramCount}`);
      paramCount += 1;
      values.push(value);
    });
    return { sql, parameters: values };
  }

  /**
   * @param {SQLFormatOptions} options
   * @returns {FormattedSQL}
   */
  formatSQL(options) {
    let sql = this._getSQLFile(options.file);
    let output = { sql };
    if (
      options.additionalQueries &&
      typeof options.additionalQueries === 'object'
    ) {
      output.sql = this._includeAdditionalQueries(
        sql,
        options.additionalQueries
      );
    }
    if (options.parameters && typeof options.parameters === 'object') {
      output = this._includeParameters(sql, options.parameters);
    }
    return output;
  }

  /**
   * @param {SQLFormatOptions} options
   */
  async runSQLFile(options) {
    const formattedSQL = this.formatSQL(options);
    const results = await this.queryDatabase(
      formattedSQL.sql,
      formattedSQL.parameters
    );
    return results;
  }

  /**
   * @param {String} sql
   * @param {Array} parameters
   */
  async queryDatabase(sql, parameters = []) {
    console.log(sql);
    console.log(parameters);

    const connection = await this.db.connect();
    const results = await connection.query(sql, parameters);
    connection.release();
    return results.rows;
  }
}

module.exports = Database;
