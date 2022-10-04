module.exports = {
	presets: [
		[
			"@babel/preset-env",
			{
				targets: {
					node: "current", // target current node version
					/* all of our non-standard JS stuff is going to get compiled
					 ** into a version of JS that our current version of node knows how to read */
				},
			},
		],
		"@babel/preset-react", // enable jest to read jsx
		"@babel/preset-typescript", // enable jest to read typescript
	],
};
