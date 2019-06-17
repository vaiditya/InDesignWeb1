import React, { Component } from "react";
import PropTypes from "prop-types"

export class Caret {
    /**
     * get/set caret position
     * @param {HTMLColletion} target 
     */
    constructor(target) {
        this.isContentEditable = target && target.contentEditable
        this.target = target
    }
    /**
     * get caret position
     * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Range}
     * @returns {number}
     */
    getPos() {
        // for contentedit field
        if (this.isContentEditable) {
            this.target.focus()
            let _range = document.getSelection().getRangeAt(0)
            let range = _range.cloneRange()
            range.selectNodeContents(this.target)
            range.setEnd(_range.endContainer, _range.endOffset)
            return range.toString().length;
        }
        // for texterea/input element
        return this.target.selectionStart
    }

    /**
     * set caret position
     * @param {number} pos - caret position
     */
    setPos(pos) {
        // for contentedit field
        if (this.isContentEditable) {
            this.target.focus()
            document.getSelection().collapse(this.target, pos)
            return
        }
        this.target.setSelectionRange(pos, pos)
    }
}

function normalizeHtml(str) {
  return str && str.replace(/&nbsp;|\u202F|\u00A0/g, ' ');
}

export default class ContentEditable extends Component {
  static propTypes = {
    html: PropTypes.string,
    onChange: PropTypes.func,
    onBlur: PropTypes.func,
    onKeyUp: PropTypes.func,
    onKeyDown:  PropTypes.func,
    disabled: PropTypes.bool,
    tagName: PropTypes.string,
    className: PropTypes.string,
    style: PropTypes.object,
    innerRef: PropTypes.oneOfType([
      PropTypes.object,
      PropTypes.func,
    ])
  }

  currentCaretPosition = 0;
  previousCaretPosition = 0;
  prevElement=null;

  el = typeof this.props.innerRef === 'function' ? { current: null } : React.createRef();
  getEl = () => (this.props.innerRef && typeof this.props.innerRef !== 'function' ? this.props.innerRef : this.el).current;

  moveFocus = (el, position, start = true) => {
    let range = document.createRange();
    let sel = window.getSelection();
    range.setStart(el, position);
    range.collapse(start);
    sel.removeAllRanges();
    sel.addRange(range);
  }

 
  emitKeyup = (e) => {
   
    let currentPageEl = this.getEl();
    if (!currentPageEl) return;

    const selection = window.getSelection();
    
    
    if(selection.anchorNode.offsetTop === undefined) {
      this.currentCaretPosition = selection.anchorNode.parentNode ? selection.anchorNode.parentNode.offsetTop + selection.anchorNode.parentNode.offsetHeight: 0
    } else {
      this.currentCaretPosition = selection.anchorNode ? selection.anchorNode.offsetTop + selection.anchorNode.offsetHeight: 0
    }
    // console.log("selection",selection)
    // console.log("this.currentCaretPosition",this.currentCaretPosition)
    if(e.keyCode === 8) {
      if(selection.anchorNode.offsetTop !== undefined && selection.anchorNode.offsetTop === 0) {
        e.preventDefault()
        const previousEditableEl = document.getElementById("editable_ucd")
        previousEditableEl.focus()
        this.moveFocus(previousEditableEl, previousEditableEl.childElementCount - 1, true)
      } else {
        if(selection.anchorNode.offsetTop === undefined) {
          console.log("parentNode: ", selection.anchorNode.parentNode.offsetTop)
          // if user have typed something and reached to the first line by erasing all the words
          if(selection.anchorOffset - 1 === 0 && selection.anchorNode.parentNode.offsetTop === 0) {
            e.preventDefault()
            const previousEditableEl = document.getElementById("editable_ucd")
            console.log("Remove node from child and append it to parent ...!")
            if(currentPageEl.childElementCount === 1) {
              currentPageEl.innerHTML = "<span><br></span>"
            } else {
              currentPageEl.removeChild(currentPageEl.firstChild)
            }
            previousEditableEl.focus()
            this.moveFocus(previousEditableEl, previousEditableEl.childElementCount, false)
          // if user have typed something and taken cursor back to start position on first line
          } else if(selection.anchorOffset - 1 === -1 && selection.anchorNode.parentNode.offsetTop === 0) {
            e.preventDefault()
            console.log("Remove text from behind the cursor and append it to the parent ...!")
            const previousEditableEl = document.getElementById("editable_ucd")
            const currentFirstChildNode = currentPageEl.firstChild
            previousEditableEl.appendChild(currentFirstChildNode)
            if(currentPageEl.childElementCount === 0) {
              currentPageEl.innerHTML = "<span><br></span>"
            }
            previousEditableEl.focus()
            this.moveFocus(previousEditableEl, previousEditableEl.childElementCount - 1, true)
          }
        } else {
          console.log("anchorNode: ", selection.anchorNode.offsetTop)
          // Not having any parent nodes : ideally first page of the document
          if(selection.anchorNode.offsetTop === 0) {
            e.preventDefault()
          }
        }
      }
    }
    if (e.keyCode===13){
      let caretPos=selection.anchorNode.parentNode.clientHeight+selection.anchorNode.parentNode.offsetTop
      e.preventDefault()
      let originalEl=null
      let beforeElement=null 
      let beforeElementText=null
      let afterElement=null
      let afterElementText=null
      let textNode=null 
      let brElement=null
      let brElementContainer=null

      if (selection.anchorOffset > 0 && selection.anchorOffset < selection.anchorNode.parentNode.innerText.length ){
        e.preventDefault()
        console.log("selection.anchorOffset > 0 && selection.anchorOffset < selection.anchorNode.parentNode.innerText.length")
        if(!selection.anchorNode.isEqualNode(currentPageEl)){
    
            originalEl=selection.anchorNode.parentNode; 

            beforeElement=originalEl.cloneNode(true)
            beforeElementText=beforeElement.innerText.substr(0,selection.anchorOffset)
            textNode=document.createTextNode(beforeElementText)
            beforeElement.replaceChild(textNode,beforeElement.firstChild)

            afterElement=originalEl.cloneNode(true)
            afterElementText=afterElement.innerText.substr(selection.anchorOffset)
            textNode=document.createTextNode(afterElementText)
            afterElement.replaceChild(textNode,afterElement.firstChild)
        

            brElementContainer=originalEl.cloneNode(true)
            brElement=document.createElement("br")
            brElementContainer.replaceChild(brElement,brElementContainer.firstChild)

            currentPageEl.insertBefore(beforeElement,originalEl)
            currentPageEl.insertBefore(brElementContainer,originalEl)
            currentPageEl.insertBefore(afterElement,originalEl)
            currentPageEl.removeChild(originalEl)

            this.moveFocus(textNode, 0)
        }else{
            console.log("selection.anchorNode.isEqualNode(currentPageEl)",selection)
            brElementContainer=this.prevElement.cloneNode(true)
            brElement=document.createElement("br")
            brElementContainer.replaceChild(brElement,brElementContainer.firstChild)
            this.prevElement.after(brElementContainer)
            // this.moveFocus(brElement, 0)
        

        }
        
      }else if (selection.anchorOffset === 0){
        console.log("selection.anchorOffset === 0")
        e.preventDefault()

        originalEl=selection.anchorNode.parentNode;
        
        if(!originalEl.isEqualNode(currentPageEl)){
           
            e.preventDefault()
            brElementContainer=originalEl.cloneNode(true)
            brElement=document.createElement("br")
            brElementContainer.replaceChild(brElement,brElementContainer.firstChild)

            afterElement=originalEl.cloneNode(true)
            // console.log("afterElementText",afterElement.innerText.substr(selection.anchorOffset))
            afterElementText=afterElement.innerText
            textNode=document.createTextNode(afterElementText)
            afterElement.replaceChild(textNode,afterElement.firstChild)

            currentPageEl.insertBefore(brElementContainer,originalEl)
            currentPageEl.insertBefore(afterElement,originalEl)
            currentPageEl.removeChild(originalEl)

            this.moveFocus(textNode, 0)
        }else{
          
            originalEl=selection.anchorNode;

            brElementContainer=originalEl.cloneNode(true)
            brElement=document.createElement("br")
            brElementContainer.replaceChild(brElement,brElementContainer.firstChild)

            currentPageEl.insertBefore(brElementContainer,originalEl)

            originalEl=selection.anchorNode;

            // brElementContainer=originalEl.cloneNode(true)
            // brElement=document.createElement("br")
            // brElementContainer.replaceChild(brElement,brElementContainer.firstChild)

            // currentPageEl.insertBefore(brElementContainer,originalEl)
            console.log("parent element")
            
        }

      }else{
        console.log("last case")
        e.preventDefault()
        originalEl=selection.anchorNode.parentNode;
        
        console.log("prevElement",this.prevElement)
        beforeElement=originalEl.cloneNode(true)
        // console.log("beforeElementText",beforeElement.innerText.substr(0,selection.anchorOffset))
        beforeElementText=beforeElement.innerText
        textNode=document.createTextNode(beforeElementText)
        beforeElement.replaceChild(textNode,beforeElement.firstChild)

        brElementContainer=originalEl.cloneNode(true)
        brElement=document.createElement("br")
        brElementContainer.replaceChild(brElement,brElementContainer.firstChild)

        this.prevElement=beforeElement;

        currentPageEl.insertBefore(beforeElement,originalEl)
        currentPageEl.insertBefore(brElementContainer,originalEl)
        currentPageEl.removeChild(originalEl)
      }
      if(caretPos>=currentPageEl.clientHeight && currentPageEl.lastElementChild.offsetHeight + currentPageEl.lastElementChild.offsetTop > currentPageEl.clientHeight){
        const nextEditableEl = document.getElementById("editable_u16b")
        // nextEditableEl.focus()
      }
    }
  

    if(this.currentCaretPosition !== this.previousCaretPosition) {
      const currentPageElHeight = currentPageEl.clientHeight

      // Current Editable reference
      const currentEditableEl = document.getElementById(`editable_${this.props.page.id}`)
      let currentEditableElHeight = currentPageEl.lastElementChild ? currentPageEl.lastElementChild.offsetHeight + currentPageEl.lastElementChild.offsetTop: 0
     
      // Next Editable reference
      const nextEditableEl = document.getElementById("editable_u16b")
      const nextEditableElHeight = nextEditableEl.clientHeight
      
      let currentPageItem = []
      let nextPageItem = []
 
      if(currentEditableElHeight > currentPageElHeight) {
        
        let currentEditableElLastChild = currentEditableEl.lastElementChild
        let nextEditableElfirstChild = nextEditableEl.firstElementChild
      

        if(this.currentCaretPosition > currentPageElHeight) {
            console.log("this.currentCaretPosition > currentPageElHeight")
            let lastEditableModifiedText=""
            let span=document.createElement("span")
            let childNode=null
          if(currentEditableElLastChild.offsetHeight + currentEditableElLastChild.offsetTop > currentPageElHeight && currentEditableElLastChild.offsetTop < currentPageElHeight) {


            while(currentEditableElHeight > currentPageElHeight){
                
                const currentPageItem = currentEditableElLastChild.innerText.split(" ")
                lastEditableModifiedText = currentPageItem.pop() + " " + lastEditableModifiedText
                currentEditableElLastChild.innerHTML = currentPageItem.join(" ")
                
                
                if(currentEditableElLastChild.innerText.trim().length===0 || currentEditableElLastChild.innerHTML==='<br>'){
                    // console.log("empty span")
                    let span = document.createElement("span");
                    // currentEditableElLastChild.innerHTML=lastEditableModifiedText
                    if(currentEditableElLastChild.innerHTML==='<br>'){
                        span.appendChild(document.createElement("br"))
                    }else{
                        span.appendChild(document.createTextNode(lastEditableModifiedText))
                    }
    
                    nextEditableEl.insertBefore(span,nextEditableEl.firstElementChild)
                    lastEditableModifiedText=''
                    currentEditableEl.removeChild(currentEditableElLastChild)
                    currentEditableElLastChild = currentEditableEl.lastElementChild
                }
                currentEditableElHeight = currentPageEl.lastChild ? currentPageEl.lastElementChild.offsetHeight + currentPageEl.lastElementChild.offsetTop: 0
                
                }
                if(lastEditableModifiedText.length > 0){
                    span = document.createElement("span");
                    childNode=document.createTextNode(lastEditableModifiedText)
                    span.appendChild(childNode)
                    nextEditableEl.insertBefore(span,nextEditableEl.firstElementChild)
                    lastEditableModifiedText=''
                }else{
                    // console.log("hi hi hahahahah")
                    span = document.createElement("span");
                    childNode=document.createElement("br")
                    span.appendChild(childNode)
                    nextEditableEl.insertBefore(span,nextEditableEl.firstElementChild)
                }
                console.log("currentPageEl.lastChild",currentEditableElHeight,currentPageEl.lastElementChild)
                if(currentPageEl.lastElementChild.innerHTML==='<br>' && currentPageEl.lastElementChild.offsetTop===0){
                    currentPageEl.removeChild(currentPageEl.lastElementChild)
                    currentEditableElHeight = currentPageEl.lastChild ? currentPageEl.lastElementChild.offsetHeight + currentPageEl.lastElementChild.offsetTop: 0
                }
                // const nextEditableEl = document.getElementById("editable_u16b")
                nextEditableEl.focus()
                
            // const currentPageItem = currentEditableElLastChild.innerText.split(" ")
            // const lastEditableModifiedText = currentPageItem.pop()
            // nextPageItem.unshift(lastEditableModifiedText)
            // // console.log("removed",lastEditableModifiedText)
            // // console.log("current",currentPageItem)
            
            // currentEditableElLastChild.innerHTML = currentPageItem.join(" ")

            // const nextPageText = nextPageItem.join("")
            // let textNode=null
            // if(nextEditableElfirstChild.innerHTML === "<br>" && nextEditableEl.childElementCount === 1) {
            //   const span = document.createElement("span");
            //   textNode = document.createTextNode(nextPageText);
            //   span.appendChild(textNode)
            //   nextEditableEl.insertBefore(span, nextEditableElfirstChild)
            // } else {
                
            //   const span = document.createElement("span");
            //   textNode = document.createTextNode(nextPageText + nextEditableElfirstChild.innerText);
            //   span.appendChild(textNode)
            //   nextEditableEl.insertBefore(span, nextEditableElfirstChild)
            //     nextEditableEl.removeChild(nextEditableElfirstChild)
            // }

            return this.moveFocus(childNode, 0)
          }

          if(nextEditableElfirstChild.innerHTML === "<br>" && nextEditableEl.childElementCount === 1) {
            nextEditableEl.replaceChild(currentEditableElLastChild, nextEditableElfirstChild)
            nextEditableEl.focus()
          } else {
            nextEditableEl.insertBefore(currentEditableElLastChild, nextEditableElfirstChild)
            nextEditableEl.focus()
          } 

        } else {
          console.log("Move content to the next page")
            let span = document.createElement("span");
            let lastEditableModifiedText = "";
            while(currentEditableElHeight > currentPageElHeight){
            // while(i<3){
            
            const currentPageItem = currentEditableElLastChild.innerText.split(" ")
            lastEditableModifiedText = currentPageItem.pop() + " " + lastEditableModifiedText
            currentEditableElLastChild.innerHTML = currentPageItem.join(" ")
            // console.log("currentEl",currentEditableElLastChild)
            // console.log(currentEditableEl.lastElementChild)
            
            
            if(currentEditableElLastChild.innerHTML.trim().length===0 || currentEditableElLastChild.innerHTML==='<br>'){
                // console.log("empty span")
                let span = document.createElement("span");
                // currentEditableElLastChild.innerHTML=lastEditableModifiedText
                if(currentEditableElLastChild.innerHTML==='<br>'){
                    span.appendChild(document.createElement("br"))
                    console.log("<br>found")
                }else{
                    span.appendChild(document.createTextNode(lastEditableModifiedText))
                }
                

                nextEditableEl.insertBefore(span,nextEditableEl.firstElementChild)
                lastEditableModifiedText=''
                currentEditableEl.removeChild(currentEditableElLastChild)
                currentEditableElLastChild = currentEditableEl.lastElementChild
            }
            currentEditableElHeight = currentPageEl.lastChild ? currentPageEl.lastElementChild.offsetHeight + currentPageEl.lastElementChild.offsetTop: 0
            
            }
            if(lastEditableModifiedText.length > 0){
                span = document.createElement("span");
                span.appendChild(document.createTextNode(lastEditableModifiedText))
                nextEditableEl.insertBefore(span,nextEditableEl.firstElementChild)
                lastEditableModifiedText=''
            }else{
                span = document.createElement("span");
                span.appendChild(document.createElement("br"))
                nextEditableEl.insertBefore(span,nextEditableEl.firstElementChild)
            }
       
            if(currentPageEl.lastElementChild.innerHTML==='<br>' && currentPageEl.lastElementChild.offsetTop===0){
                currentPageEl.removeChild(currentPageEl.lastElementChild)
                currentEditableElHeight = currentPageEl.lastChild ? currentPageEl.lastElementChild.offsetHeight + currentPageEl.lastElementChild.offsetTop: 0
            }
        
        }
      }else{
          console.log("not greTER")
      }
    }

    this.previousCaretPosition = this.currentCaretPosition
  }

  render() {
    const { tagName ='span', html = "", innerRef, page, style, ...props } = this.props;

    return React.createElement(
      tagName,
      {
        ...props,
        ref: typeof innerRef === 'function' ? (current) => {
          innerRef(current)
          this.el.current = current
        } : innerRef || this.el,
        // onClick: this.emitKeyup,
        onInput: this.emitKeyup,
        onKeyDown: this.emitKeyup,
        contentEditable: !this.props.disabled,
        dangerouslySetInnerHTML: { __html:this.props.page.prev_page===null? `<span style='font-weight: normal; color:rgb(0, 0, 0); font-family:Montserrat; line-height: 14.4pt; font-size: 12pt; '>What is Lorem Ipsum?</span> 
        <span><br></span><span style='font-weight: normal; color:rgb(0, 0, 0); font-family:Montserrat; line-height: 14.4pt; font-size: 12pt; '>Lorem Ipsum is simply dummy text of the printing and typesetting industry. 
        Lorem Ipsum has been the industry’s standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five 
        centuries, but also the leap into </span>
         <span style='font-weight: normal; color:rgb(0, 0, 0); font-family:Montserrat; line-height: 14.4pt; font-size: 12pt; '>electronic</span> 
         <span style='font-weight: normal; color:rgb(0, 0, 0); font-family:Montserrat; line-height: 14.4pt; font-size: 12pt; '> typesetting, remaining essentially unchanged. It was popularised in the 1960s with 
         the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including version</span> 
         <span style='font-weight: normal; color:rgb(0, 0, 0); font-family:Montserrat; line-height: 14.4pt; font-size: 12pt; '>s</span> 
         <span style='font-weight: normal; color:rgb(0, 0, 0); font-family:Montserrat; line-height: 14.4pt; font-size: 12pt; '> of Lorem Ipsum.
         </span> 
         <span><br></span><span><br></span><span><br></span><span><br></span><span style='font-weight: normal; color:rgb(0, 0, 0); font-family:Montserrat; line-height: 14.4pt; font-size: 12pt; '>Why do we use it?</span> <span><br></span>
         <span style='font-weight: normal; color:rgb(0, 0, 0); font-family:Montserrat; line-height: 14.4pt; font-size: 12pt; '>It is a long established fact that a reader will be distracted by the readable content of 
         a page when looking at its layout. The point of using Lorem Ipsum is that it has a more-or-less normal distribution of letters, as opposed to using ‘Content here, content here’, making it look like readable English. 
         Many desktop publishing packages and web page editors now use Lorem Ipsum as their default model text, and a search for ‘lorem ipsum’ will uncover many web sites still in 
         </span> 
         <span><br></span><span><br></span><span style='font-weight: normal; color:rgb(0, 0, 0); font-family:Montserrat; line-height: 14.4pt; font-size: 12pt; '>their infancy. Various versions have evolved over the BMW</span><span><br></span>
         <span style='font-weight: normal; color:rgb(0, 0, 0); font-family:Montserrat; line-height: 14.4pt; font-size: 12pt; '>bmw  years, sometimes by accident,sometimes on purpose bm   (injected humour and the like).</span>
    `: html },
        style
      },
    this.props.children);
  }
}
