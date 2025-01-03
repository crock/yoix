import fs from 'node:fs'
import path from 'node:path'

const pagesDir = path.join(process.cwd(), 'pages')
const publicDir = path.join(process.cwd(), 'public')
const staticDir = path.join(process.cwd(), 'static')
const rootPath = process.cwd()

function getAllFiles(dirPath, arrayOfFiles) {
    const files = fs.readdirSync(dirPath)
  
    arrayOfFiles = arrayOfFiles || []
  
    files.forEach(function(file) {
      if (fs.statSync(dirPath + "/" + file).isDirectory()) {
        arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles)
      } else {
        arrayOfFiles.push(path.join( dirPath, file))
      }
    })
  
    return arrayOfFiles
}

function parseMarkdown(markdownText) {
	const htmlText = markdownText
		.replace(/^### (.*$)/gim, '<h3>$1</h3>')
		.replace(/^## (.*$)/gim, '<h2>$1</h2>')
		.replace(/^# (.*$)/gim, '<h1>$1</h1>')
		.replace(/^\> (.*$)/gim, '<blockquote>$1</blockquote>')
		.replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
		.replace(/\*(.*)\*/gim, '<em>$1</em>')
		.replace(/!\[(.*?)\]\((.*?)\)/gim, "<img alt='$1' src='$2' />")
		.replace(/\[(.*?)\]\((.*?)\)/gim, "<a href='$2'>$1</a>")
		.replace(/\n$/gim, '<br />')

	return htmlText.trim()
}

export function buildPages() {
    let files = getAllFiles(pagesDir)
    // console.log(files)
    const pageStyles = `
body { padding: 1rem; font-size: 20px; font-weight: 300; font-family: 'Avenir', sans-serif; }
h1 { font-weight: black; font-size: 26px; margin-bottom: 16px; }   
`

    if (files.length >= 1) {
        if (!fs.existsSync(publicDir)) {
            fs.mkdirSync(publicDir)
        }

        files.forEach(fp => {
            const permalink = fp.replace(`${rootPath}/pages`, '')
            let pathSegments = permalink.split('/')
            const filename = pathSegments.pop()
            const [name, extension] = filename.split('.')
            if (extension != undefined) {
                if (!fs.existsSync(path.join(publicDir, name)) && name != 'index') {
                    fs.mkdirSync(path.join(publicDir, name))
                }
                const pathSegmentsWithoutFilename = pathSegments.filter(Boolean)
                if (pathSegmentsWithoutFilename.length > 1) {
                    if (!fs.existsSync(path.join(publicDir, ...pathSegmentsWithoutFilename))) {
                        fs.mkdirSync(path.join(publicDir, ...pathSegmentsWithoutFilename))
                    }
                    const nestedPageFp = path.join(pagesDir, ...pathSegmentsWithoutFilename, 'index.md')
                    const contents = fs.readFileSync(nestedPageFp).toString('utf-8')
                    const html = buildDocument(contents, pageStyles)
                    const pagePath = path.join(publicDir, ...pathSegmentsWithoutFilename, 'index.html')
                    fs.writeFileSync(pagePath, html)
                } else {
                    const contents = fs.readFileSync(fp).toString('utf-8')
                    const html = buildDocument(contents, pageStyles)
                    const pagePath = name === 'index' ? path.join(publicDir, 'index.html') : path.join(publicDir, name, 'index.html')
                    fs.writeFileSync(pagePath, html)
                }
            } else {
                fs.mkdirSync(path.join(publicDir, name))
            }
            
        })
    }
}

const buildDocument = (content, pageStyles) => {
    let doc = ""

    doc += `
<!DOCTYPE html>
<html lang="en">

`
    doc += buildHead()
    doc += globalStyles(pageStyles)
    doc += buildBody(parseMarkdown(content))

    doc += `

</html>
`

    copyStaticAssets()
    // console.log(doc)
    return doc
}

const buildHead = (config) => {

    if (!config) {
        config = {
            site: {
                title: "Yoix",
                description: "Yoix is a static site generator for the web.",
                url: "https://yoix.org"
            }
        }
    }

    let head = ""

    head += `
<head>
`

    head += `<title>${config.site.title}</title>`

    head += linkExternalStyleSheets([
        {
            href: `${config.site.url}/styles.css`
        }
    ])

    head += '\n'

    head += generateScriptTags([
        {
            src: 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js',
            async: true,
            type: 'text/javascript',
            children: null,
        }
    ])

    head += `
</head>    
`

    console.log(head)
    return head
}

const generateScriptTags = (scripts = []) => {
    const tags = scripts.map(script => `<script src="${script.src}" type="${script.type}" ${script.async ? "async" : ""}>${script.children ? `${script.children}</script>` : "</script>"}`)
    return tags.join('\n')
}

const linkExternalStyleSheets = (stylesheets = []) => {
    const tags = stylesheets.map(stylesheet => `<link href="${stylesheet.href}" type="text/css" rel="stylesheet" />`)
    return tags.join('\n')
}

const buildBody = (content = "") => {
    let body = ""

    body += `
<body>    
`

    body += content

    body += `
</body>
`

    // console.log(body)
    return body
}

const resetStyles = () => {
    const css = fs.readFileSync(path.join(staticDir,'reset.css')).toString('utf-8')
    return css
}

const globalStyles = (custom = "") => {
    let css = "<style>\n"

    css += resetStyles()
    css += `
:root {
    --primary-color: #3ebb79;
}
a { color: const(--primary-color); } 
strong { font-weight: bold; }
em { font-style: italic; }

`
    css += custom
    css += "\n</style>\n"

    // console.log(css)
    return css
}

const copyStaticAssets = () => {
    const files = getAllFiles(staticDir)
    files.forEach(file => fs.copyFileSync(file, path.join(publicDir, path.basename(file))))
}
