function cleanUpDeeply(value) {
	if (Array.isArray(value)) {
		for (let index = 0; index < value.length; ) {
			if (value[index] === '\x00') {
				value.splice(index, 1);
			} else {
				cleanUpDeeply(value[index]);
				++index;
			}
		}
	} else if (typeof value === 'object') {
		for (let key in value) {
			if (value[key] === '\x00') {
				delete value[key];
			} else {
				cleanUpDeeply(value[key]);
			}
		}
	}
}


module.exports = cleanUpDeeply;