var ferrisTypes = [
    {
      attr: 'does_not_compile',
      title: '這些程式碼不能編譯！'
    },
    {
      attr: 'panics',
      title: '這些程式碼會 panic！'
    },
    {
      attr: 'unsafe',
      title: '這些程式碼塊包含不安全（unsafe）代碼。'
    },
    {
      attr: 'not_desired_behavior',
      title: '這些程式碼不會產生期望的行為。'
    }
  ]
  
  document.addEventListener('DOMContentLoaded', () => {
    for (var ferrisType of ferrisTypes) {
      attachFerrises(ferrisType)
    }
  })
  
  function attachFerrises (type) {
    var elements = document.getElementsByClassName(type.attr)
  
    for (var codeBlock of elements) {
      var lines = codeBlock.textContent.split(/\r|\r\n|\n/).length - 1;
  
      if (lines >= 4) {
        attachFerris(codeBlock, type)
      }
    }
  }
  
  function attachFerris (element, type) {
    var a = document.createElement('a')
    a.setAttribute('href', 'ch00-00-introduction.html#ferris')
    a.setAttribute('target', '_blank')
  
    var img = document.createElement('img')
    img.setAttribute('src', 'img/ferris/' + type.attr + '.svg')
    img.setAttribute('title', type.title)
    img.className = 'ferris'
  
    a.appendChild(img)
  
    element.parentElement.insertBefore(a, element)
  }