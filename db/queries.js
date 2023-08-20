/*
 * (c) William Guerrand <guerrandw@gmail.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

const pool = require('./index')

const incrementUserView = async (username) => {
	const client = await pool.connect()

	try {
		await client.query('BEGIN')

		const updateQuery = `
			INSERT INTO views (username, count) VALUES ($1, 1)
			ON CONFLICT (username)
			DO UPDATE SET count = views.count + 1
			RETURNING count;
		`

		const res = await client.query(updateQuery, [username])

		await client.query('COMMIT')
		return res.rows[0].count - 1

	} catch (e) {
		await client.query('ROLLBACK')
		throw e
	} finally {
		client.release()
	}
}


module.exports = {
	incrementUserView
}