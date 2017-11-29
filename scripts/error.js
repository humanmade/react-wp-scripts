window.onload = function() {
	var errorContent ='<div style="font-family:monospace;background:rgba(206, 17, 38, 0.7);color:white;position:absolute;top:0;left:0;right:0;padding:20px;"> \
		<p>React bundle could not be loaded</p> \
		<p>Make sure that webpack dev server is running or that you have build your assets</p>';

	errorContent += '<ul>';
	errorContent += '<li><strong>Development mode: </strong>' + !! reactWpScripts.devMode + '</li>';
	errorContent += '<li><strong>Directory: </strong>' + reactWpScripts.directory + '</li>';
	errorContent += '<li><strong>Base URL: </strong>' + reactWpScripts.opts.base_url + '</li>';
	errorContent += '</ul>';
	errorContent += '</div>';

	document.body.innerHTML = errorContent;
};