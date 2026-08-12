module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    'User',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      username: {
        type: DataTypes.STRING(32),
        allowNull: false,
      },
      password_hash: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      tableName: 'users',
      timestamps: true,
      // Keeps the hash out of every SELECT, including when User is eager-loaded
      // through an association. Only `withPassword`, `unscoped()`, or an explicit
      // `attributes` list brings it back — all deliberate opt-ins.
      defaultScope: { attributes: { exclude: ['password_hash'] } },
      // Empty on purpose: this is `unscoped()` under a friendlier name. If a
      // `where` is ever added to defaultScope, this scope will NOT inherit it —
      // which matters, because the one caller is the login path.
      scopes: { withPassword: {} },
    }
  );

  // defaultScope shapes SELECT attribute lists and nothing else, so it cannot
  // touch the instance returned by create()/build() — whose password_hash IS
  // populated. Verified: `JSON.stringify(await User.create({...}))` contains the
  // hash without this override, so the obvious `res.json(user)` in a register
  // route would ship a bcrypt hash to the client.
  //
  // Overriding toJSON is what actually makes "a route cannot leak it by accident"
  // true, on every path rather than just on reads. Login is unaffected: it reads
  // `user.password_hash` directly off the withPassword instance, not via toJSON.
  User.prototype.toJSON = function toJSON() {
    const values = { ...this.get() };

    delete values.password_hash;

    return values;
  };

  return User;
};
