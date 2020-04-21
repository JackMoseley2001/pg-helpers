# Node-Postgres Extensions

## Usage

### Setup

Create a database instance by importing and initialising the database class:

```

// Same configuration as pg uses for setting up a pool
const config = {
  database: 'db_name',
  host: 'localhost',
  timeout: 5000
}

// The root directory which contains your sql files. An example structure for this folder can be found below
const sqlPath = path.join(__dirname, 'sql')

const db = new Database(config, sql);
```

### File structure

The SQL directory that is used can be formatted as shown below:

```
sql
 - auth
    - login.sql
    - register.sql
 - profiles
    - find.sql
    - findOne.sql
    - remove.sql
- create_tables.sql
```

### Run SQL File

You can run these files by using the `runSQLFile` function as shown below. To specify the file, just use a dot format, where each dot is another directory down. The sql extension is added onto the path by default:

```
const results = await db.runSQLFile({ file: 'auth.login', parameters: { username: 'test1@example.com', password: 'hello-world' } });
```

The parameters option relates to variables you can enter into your sql file. The auth file may look like this:

```
SELECT * FROM auth WHERE username = :username AND password = :password;
```

Each key is related to an item within the sql starting with a colon and having the same value as the object key. The value is parsed into the correct datatype (using node-postgres \$ syntax).

### Adding additional queries

`runSQLFile` also includes a way to extend the query within the sql file by allowing you to add queries, using the colon variable syntax.

**_example.js_**

```
const extra = 'location = :city AND age > :min_age';
db.runSQLFile({file: 'profiles.find', additionalQueries: { extra }, parameters: { city: 'London', age: 18 }})
```

**_/profiles/find.sql_**

```
SELECT * FROM profiles WHERE :extra;
```

The formatted sql will become:

```
SELECT * FROM profiles WHERE location = :city AND age > :min_age;
```

### Manual SQL

You can also manually enter sql within javascript files using `queryDatabase`. This expects the \$ syntax already, and accepts the sql as the first argument, and the parameters for the second.

```
const results = await db.queryDatabase('SELECT * FROM auth WHERE username = $1', ['test1@example.com']);
```

You can get a formatted sql string from a file without running it by using the `formatSQL` function, which takes the same arguments as the `runSQLFile` function. This will return both a formatted sql string, and the parameters.

```
const formattedSQL = db.formatSQL({ file: 'auth.login', parameters: { username: 'test1@example.com', password: 'hello-world' }})

formattedSQL.sql === 'SELECT * FROM auth WHERE username = $1 AND password = $2;'
formattedSQL.parameters === ['test1@example.com', 'hello-world']

```
