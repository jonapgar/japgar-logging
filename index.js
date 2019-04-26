const debug = require('debug')
const noop = ()=>undefined
const troo = ()=>true
const falz = ()=>false

debug.ourEnable = debug.enable

const cwd = process ? process.cwd() + '/' : ''
const __stack = function(a, n) {
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
const wrap = (func, depth, length)=>{

	return (...args)=>{

		
		
		args = args.map(a=>{
			return (a instanceof Error) && a.stack ? `\n${a.stack}\n${a}` : a
		})
		
		if (typeof args[0] !== 'string') {
			args.unshift(args.length > 1 ? '%o' : '')
		}

		args[0] = '(%s) ' + args[0]
		args.splice(1, 0, __stack(depth, length));

		return func(...args)
	}
}
const getDebugKey = (prefix,level)=>{
	return [prefix,level].filter(v=>!!v).join(':')
}
const levels = ['verbose', 'log', 'notice', 'warn', 'error', 'special']

module.exports = (prefix,{logkey='zzz',loglevel ='verbose',logstack=true},g=null)=>{
	
	g = g || global;

	const zzz = g[logkey] = g[logkey] || {}
	debug.enable = ()=>{
		zzz.error('Someone else is trying to enable logging')
	}		
	debug.names = []
	debug.skips = []
	
	let	activeLevel
	levels.forEach(level=>{

		if (activeLevel || loglevel == level) {
			activeLevel = level;
			let debugKey = getDebugKey(prefix,level)
			debug.names.push(new RegExp('^' + debugKey + '$'));
			let func = debug(debugKey)	
			for (let i = 0; i < 5; i++) {
				zzz[level + (i || '')] = logstack ? wrap(func,i + 1, 1):func
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
