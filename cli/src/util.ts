export function promptPassword(prompt: string): Promise<string> {
	return new Promise((resolve) => {
		const stdout = process.stdout;
		const stdin = process.stdin;
		let input = "";

		stdout.write(prompt);
		stdin.setRawMode(true);
		stdin.resume();
		stdin.setEncoding("utf-8");

		function onData(data: string) {
			switch (data) {
				case "\u0004": // Ctrl-d
				case "\r":
				case "\n":
					enter();
					break;

				case "\u0003": // Ctrl-c
					ctrlc();
					break;

				default:
					// backspace
					if (data.charCodeAt(0) === 8) {
						backspace();
					} else {
						newchar(data);
					}
					break;
			}
		}

		function enter() {
			stdin.removeListener("data", onData);
			stdin.setRawMode(false);
			stdin.pause();
			process.stdout.write("\n");
			resolve(input);
		}

		function ctrlc() {
			stdin.removeListener("data", onData);
			stdin.setRawMode(false);
			stdin.pause();
		}

		function newchar(c: string) {
			input += c;
		}

		function backspace() {
			input = input.slice(0, input.length - 1);
		}

		stdin.on("data", onData);
	});
}
