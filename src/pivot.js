export default function(data){
	if (!data) {
		return [];
	}
	const out = [];
	for (var i = 1; i < data.length; i++) {
		const obj = {};
		const row = data[i];
		for (var j = 0; j < row.length; j++) {
			obj[data[0][j]] = row[j];
		}
		out.push(obj);
	}
	return out;
};