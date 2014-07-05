// Initialise function
// Set up all the tablesorter tables
$(document).ready(function()
{
	var tables = document.getElementsByClassName ('tablesorter');
	for (i = 0; i < tables.length; i++) {
		var id = 'ts_' + i;
		tables[i].setAttribute ('id', id);
		$('#' + id).tablesorter({
			sortList : [[0,0]],
			theme : 'default',
			widgets : ['zebra']
		});
	}
}
);

