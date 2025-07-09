export const separateContent = (body: string) => {
    const textParts: string[] = [];
    const mediaParts: string[] = [];
    const lines = body.split("\n");
    lines.forEach((line: string) => {
        if (line.match(/!\[.*?\]\(.*\)/) || line.match(/<iframe.*<\/iframe>/)) {
            mediaParts.push(line);
        } else {
            textParts.push(line);
        }
    });
    return { text: textParts.join("\n"), media: mediaParts.join("\n") };
};
