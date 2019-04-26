const debug = require('debug')
const noop = ()=>undefined
const troo = ()=>true
const falz = ()=>false

debug.ourEnable = debug.enable




module.exports = (prefix,{logkey='zzz',loglevel:level ='verbose',logstack=true},g=null)=>{
	
	g = g || global;

	const zzz = g[logkey] = g[logkey] || {}
	
	debug.enable = ()=>{
		zzz.error('Someone else is trying to enable logging')
	}

	const getDebugKey = level=>{
		return [g._log_prefix, process.pid,global.port,global.clusterIndex || '0',level].filter(v=>!!v).join(':')
	}

	const wrap = (func, depth, length)=>{

		return (...args)=>{

			if (!logstack) {
				return func(...args);
			}
			
			args = args.map(a=>{
				return (a instanceof Error) && a.stack ? `\n${a.stack}\n${a}` : a
			})
			
			if (typeof args[0] !== 'string') {
				args.unshift(args.length > 1 ? '%o' : '')
			}

			args[0] = '(%s) ' + args[0]
			args.splice(1, 0, g.__stack(depth, length));

			return func(...args)
		}
	}

	const updateLogging = (prefix, loglevel)=>{
		if (prefix == g._log_prefix && loglevel == g._log_level) {
			return
		}
		
		debug.names = []
		debug.skips = []

		g._log_prefix = prefix
		g._log_level = loglevel

		let levels = ['verbose','log', 'notice', 'warn', 'error','special']
		let	activeLevel
		
		// debug.ourEnable(debug.load())
		
		levels.forEach(level=>{

			if (activeLevel || loglevel == level) {
				activeLevel = level;
				
				debug.names.push(new RegExp('^' + getDebugKey(level) + '$'));
				let func = debug(getDebugKey(level))	
				for (let i = 0; i < 5; i++) {
					zzz[level + (i || '')] = wrap(func, i + 1, 1)
				}
			} else {
				
				for (let i = 0; i < 5; i++) {
					zzz[level + (i || '')] = noop
				}
			}

			zzz[level]('%s IS ENABLED BY %s',level,loglevel)
			
		})
		zzz.enabled=level=>zzz[level]!==noop
		
	}

	const cwd = process.cwd() + '/'
	g.__stack = function(a, n) {
		let orig = Error.prepareStackTrace;
		Error.prepareStackTrace = function(_, stack) {
			return stack;
		};
		let err = new Error;
		Error.captureStackTrace(err, arguments.callee);
		let stack = err.stack;
		Error.prepareStackTrace = orig;

		let arr = [];
		n = n || 10;
		a = a || 0;
		for (let i = a; i < a + n; i++) {
			if (!stack[i])
				break;
			let fn = stack[i].getFileName()
			let line
			if (!fn) {
				fn = 'anon'
				line = 'anon'
			} else {
				line = stack[i].getLineNumber()
			}
			arr.push(fn.replace(cwd, '') + ':' + line)
		}
		return arr.join('\n')
	}

	updateLogging(prefix,level)

}
