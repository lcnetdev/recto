/*!
* bibframe.js
*/

function getExamples() {
	
	i=1;
	exDiv="#ex" + i
	iduri=$(exDiv).data("example-id");
	while(iduri) {
		$(exDiv + 'rdfxml pre').text("Loading...");
		$.ajax({
			async: false,
			type: 'GET',
			url: '/data/example' + iduri, 
			success: function(data) {
					//alert("first success " + exDiv);
					//alert("Data Loaded: " + data.n3);
					$(exDiv + 'rdfxml pre').text(data.rdfxml);
					$(exDiv + 'n3 pre').text(data.n3);
					$(exDiv + 'nt pre').text(data.nt);
				}
			});
		i++;
		exDiv="#ex" + i
		iduri=$(exDiv).data("example-id");
	}

}
