var fs = require('fs')
var path = require('path')

var pagesDir = path.join(process.cwd(), 'pages')
var publicDir = path.join(process.cwd(), 'public')
var staticDir = path.join(process.cwd(), 'static')
var rootPath = process.cwd()

function getAllFiles(dirPath, arrayOfFiles) {
    files = fs.readdirSync(dirPath)
  
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
	var htmlText = markdownText
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

exports.buildPages = () => {
    let files = getAllFiles(pagesDir)
    // console.log(files)
    var pageStyles = `
body { padding: 1rem; font-size: 20px; font-weight: 300; font-family: 'Avenir', sans-serif; }
h1 { font-weight: black; font-size: 26px; margin-bottom: 16px; }   
`

    if (files.length >= 1) {
        if (!fs.existsSync(publicDir)) {
            fs.mkdirSync(publicDir)
        }

        files.forEach(fp => {
            var permalink = fp.replace(`${rootPath}/pages`, '')
            let pathSegments = permalink.split('/')
            var filename = pathSegments.pop()
            var [name, extension] = filename.split('.')
            if (extension != undefined) {
                if (!fs.existsSync(path.join(publicDir, name)) && name != 'index') {
                    fs.mkdirSync(path.join(publicDir, name))
                }
                var pathSegmentsWithoutFilename = pathSegments.filter(Boolean)
                if (pathSegmentsWithoutFilename.length > 1) {
                    if (!fs.existsSync(path.join(publicDir, ...pathSegmentsWithoutFilename))) {
                        fs.mkdirSync(path.join(publicDir, ...pathSegmentsWithoutFilename))
                    }
                    var nestedPageFp = path.join(pagesDir, ...pathSegmentsWithoutFilename, 'index.md')
                    var contents = fs.readFileSync(nestedPageFp).toString('utf-8')
                    var html = this.buildDocument(contents, pageStyles)
                    var pagePath = path.join(publicDir, ...pathSegmentsWithoutFilename, 'index.html')
                    fs.writeFileSync(pagePath, html)
                } else {
                    var contents = fs.readFileSync(fp).toString('utf-8')
                    var html = this.buildDocument(contents, pageStyles)
                    var pagePath = name === 'index' ? path.join(publicDir, 'index.html') : path.join(publicDir, name, 'index.html')
                    fs.writeFileSync(pagePath, html)
                }
            } else {
                fs.mkdirSync(path.join(publicDir, name))
            }
            
        })
    }
}

exports.buildDocument = (content, pageStyles) => {
    let doc = ""

    doc += `
<!DOCTYPE html>
<html lang="en">

`
    doc += this.buildHead()
    doc += this.globalStyles(pageStyles)
    doc += this.buildBody(parseMarkdown(content))

    doc += `

</html>
`

    this.copyStaticAssets()
    // console.log(doc)
    return doc
}

exports.buildHead = () => {
    let head = ""

    head += `
<head>
`

    head += this.linkExternalStyleSheets([
        {
            href: 'https://example.com/style.css'
        }
    ])

    head += '\n'

    head += this.generateScriptTags([
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

    // console.log(head)
    return head
}

exports.generateScriptTags = (scripts = []) => {
    var tags = scripts.map(script => `<script src="${script.src}" type="${script.type}" ${script.async ? "async" : ""}>${script.children ? `${script.children}</script>` : "</script>"}`)
    return tags.join('\n')
}

exports.linkExternalStyleSheets = (stylesheets = []) => {
    var tags = stylesheets.map(stylesheet => `<link href="${stylesheet.href}" type="text/css" rel="stylesheet" />`)
    return tags.join('\n')
}

exports.buildBody = (content = "") => {
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

exports.resetStyles = () => {
    var css = fs.readFileSync(path.join(staticDir,'reset.css')).toString('utf-8')
    return css
}

exports.globalStyles = (custom = "") => {
    let css = "<style>\n"

    css += this.resetStyles()
    css += `
:root {
    --primary-color: #3ebb79;
}
a { color: var(--primary-color); } 
strong { font-weight: bold; }
em { font-style: italic; }

`
    css += custom
    css += "\n</style>\n"

    // console.log(css)
    return css
}

exports.copyStaticAssets = () => {
    var files = getAllFiles(staticDir)
    files.forEach(file => fs.copyFileSync(file, path.join(publicDir, path.basename(file))))
}