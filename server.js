/*
 * (c) William Guerrand <guerrandw@gmail.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

const express = require('express')
const app = express()
require('dotenv').config()
const rateLimit = require('express-rate-limit')
const dbQueries = require('./db/queries')
const gradientBadge = require('gradient-badge')

const PORT = 3000

const VALID_USERNAME_REGEX = /^[a-zA-Z\d](?:[a-zA-Z\d]|-(?=[a-zA-Z\d])){0,38}$/

const apiLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 50,
	message: 'Too many requests, please try again after 15 minutes'
})

app.use('/counter', apiLimiter)

app.get('/counter', (req, res) => {
	res.header({
		'Cache-Control': 'max-age=0, no-cache, no-store, must-revalidate',
		'Content-Type': 'image/svg+xml'
	})

	const userAgent = req.headers['user-agent']

	const defaultParams = {
		label: 'profile views',
		labelColor: 'grey',
		style: 'flat',
		iconWidth: 13,
		scale: 1,
		gradient: ['pink', 'F78642'],
	}

	const params = { ...defaultParams, ...req.query }

	if (req.query.gradient) params.gradient = req.query.gradient.split(',')
	if (params.icon) params.icon = 'data:image/svg+xml;base64,' + decodeURIComponent(params.icon)

	if (!userAgent.startsWith('github-camo')) { res.send(gradientBadge({ ...params, status: 'Use in GitHub only' })) }
	else if (!req.query.username)  { res.send(gradientBadge({...params, status: 'No username mentioned'})) }
	else if (!VALID_USERNAME_REGEX.test(req.query.username))  { res.send(gradientBadge({...params, status: 'Invalid username'})) }
	else if (params.status) { res.send(gradientBadge({...params, status: !isNaN(parseFloat(params.status)) ? parseFloat(params.status).toLocaleString('en-US') : params.status})) }
	else {
		dbQueries.incrementUserView(req.query.username).then(count => { res.send(gradientBadge({...params, status: count.toLocaleString('en-US')}))})
			.catch(err => { console.error('Error:', err); res.send(gradientBadge({...params, status: 'Error'})) })
	}
})

app.get('/hello', (req, res) => {
	res.send("Hello from the server!")
})

app.listen(PORT, () => {
	console.log(`Server is running on http://localhost:${PORT}`)
})
