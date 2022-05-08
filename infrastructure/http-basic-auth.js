// https://github.com/dommmel/cloudflare-workers-basic-auth/blob/master/index.js
const NAME = "friend"
const PASS = "mellon"

const CREDENTIALS_REGEXP = /^ *(?:[Bb][Aa][Ss][Ii][Cc]) +([A-Za-z0-9._~+/-]+=*) *$/

const USER_PASS_REGEXP = /^([^:]*):(.*)$/

const Credentials = function(name, pass) {
    this.name = name
    this.pass = pass
}

const parseAuthHeader = function(string) {
    if (typeof string !== 'string') {
        return undefined
    }

    const match = CREDENTIALS_REGEXP.exec(string)

    if (!match) {
        return undefined
    }

    const userPass = USER_PASS_REGEXP.exec(atob(match[1]))

    if (!userPass) {
        return undefined
    }

    return new Credentials(userPass[1], userPass[2])
}


const unauthorizedResponse = function(body) {
    return new Response(
        body, {
            status: 401,
            headers: {
                "WWW-Authenticate": 'Basic realm="User Visible Realm"'
            }
        }
    )
}

async function handle(request) {
    const credentials = parseAuthHeader(request.headers.get("Authorization"))
    if ( !credentials || credentials.name !== NAME ||  credentials.pass !== PASS) {
        return unauthorizedResponse("Unauthorized")
    } else {
        return fetch(request)
    }
}

addEventListener('fetch', event => {
    event.respondWith(handle(event.request))
})