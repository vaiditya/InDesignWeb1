import React, { Component } from "react";
import PropTypes from "prop-types"
import metadata from "./metadata";

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
  constructor(props){
    super(props);
    Object.values(metadata).map((element)=> element.pages.map((mapElement)=>this.allPages.push(mapElement)))
  }
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
  allPages=[]
  nextPageDetails=null
  currPageDetails=null
  bufferContent="";

 
  emitKeyup = (e) => {

    let currentEditableElId=`editable_${this.props.page.id}`;
    let nextEditableElId= this.props.page.next_page !== null ? `editable_${this.props.page.next_page}` : `editable_${this.props.page.id}`;
    let nextPageId=this.props.page.next_page;
    let currentPageId=this.props.page.id;
    let currentPageEl=document.getElementById(currentEditableElId)
    let previousEditableElId=this.props.page.prev_page !== null ? `editable_${this.props.page.prev_page}` : `editable_${this.props.page.id}` ;
    let fromBack = false
   
    if (!currentPageEl) return;

    const selection = window.getSelection();
   
    if(selection.anchorNode === null){

      this.currentCaretPosition = currentPageEl.lastElementChild ? currentPageEl.lastElementChild.offsetTop + currentPageEl.lastElementChild.offsetHeight:0
      this.moveFocus(currentPageEl.lastElementChild,0)

    }else if(selection.anchorNode.isEqualNode(currentPageEl)){

      this.currentCaretPosition = selection.anchorNode.lastElementChild ? selection.anchorNode.lastElementChild.offsetTop + selection.anchorNode.lastElementChild.offsetHeight: 0
     
    }else if(selection.anchorNode.offsetTop === undefined) {

      this.currentCaretPosition = selection.anchorNode.parentNode ? selection.anchorNode.parentNode.offsetTop + selection.anchorNode.parentNode.offsetHeight: 0
      
    } else {
      
      this.currentCaretPosition = selection.anchorNode ? selection.anchorNode.offsetTop + selection.anchorNode.offsetHeight: 0
    }
    // console.log("this.currentCaretPosition",this.currentCaretPosition)

    if(e.keyCode === 8) {

      let previousEditableEl = document.getElementById(previousEditableElId)
      let previousPageEl = document.getElementById(previousEditableElId)

      let prevEditableElHeight = previousEditableEl.lastElementChild ? previousEditableEl.lastElementChild.offsetHeight + previousEditableEl.lastElementChild.offsetTop: 0
      let prevPageElHeight = previousPageEl.clientHeight;

      if(selection.anchorNode.offsetTop !== undefined && selection.anchorNode.offsetTop === 0) {
        // Initially back stroke from empty space
        e.preventDefault()
     
        if  ( previousEditableEl.childElementCount === 1 && previousEditableEl.firstElementChild.innerHTML === '<br>'){
          this.moveFocus(previousEditableEl, previousEditableEl.childElementCount, true)
        }else if(previousEditableEl.childElementCount === 0){
          this.moveFocus(previousEditableEl, 0, true)
        }else{
          this.moveFocus(previousEditableEl, previousEditableEl.childElementCount, true)
        }
        
        console.log("currentPageEl",currentPageEl.firstElementChild)

      } else {

        if(selection.anchorNode.offsetTop === undefined) {
          console.log("parentNode: ", selection.anchorNode.parentNode.offsetTop)
       
          if(selection.anchorOffset - 1 === -1 && selection.anchorNode.parentNode.offsetTop === 0) {

            e.preventDefault()
            console.log("Remove text from behind the cursor and append it to the parent ...!")
            
            let currentFirstChildNode = currentPageEl.firstChild
            
            previousEditableEl.appendChild(currentFirstChildNode)
            
            prevEditableElHeight = previousEditableEl.lastElementChild ? previousEditableEl.lastElementChild.offsetHeight + previousEditableEl.lastElementChild.offsetTop: 0

            while (prevEditableElHeight < prevPageElHeight && currentFirstChildNode !== null){
             
              previousEditableEl.appendChild(currentFirstChildNode)
              this.currentCaretPosition=prevEditableElHeight

              prevEditableElHeight = previousEditableEl.lastElementChild ? previousEditableEl.lastElementChild.offsetHeight + previousEditableEl.lastElementChild.offsetTop: 0
           
              currentFirstChildNode = currentPageEl.firstChild
           
            }
            
            this.currentCaretPosition=prevEditableElHeight

            nextEditableElId=currentEditableElId
            currentEditableElId=previousEditableElId;
            fromBack = true
            

          

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
   
    currentPageEl=document.getElementById(currentEditableElId)
    let currentEditableEl=document.getElementById(currentEditableElId)
    let currentEditableElHeight=currentPageEl.lastElementChild ? currentPageEl.lastElementChild.offsetHeight + currentPageEl.lastElementChild.offsetTop: 0
    let currentEditableElLastChild=currentEditableEl.lastElementChild
   

    if(this.currentCaretPosition !== this.previousCaretPosition) {

      let j=0;
      let spaceFound = false;
      let selection = window.getSelection()
      let enteredTriggeredLoc=selection.anchorNode;
      while (j<this.allPages.length && !spaceFound){
      const currentPageElHeight = currentPageEl.clientHeight
      currentEditableElHeight = currentPageEl.lastElementChild ? currentPageEl.lastElementChild.offsetHeight + currentPageEl.lastElementChild.offsetTop: 0
      
      // Next Editable reference
      let nextEditableEl = document.getElementById(nextEditableElId)
  

      if(currentEditableElHeight > currentPageElHeight) {
        
        
        currentEditableElLastChild = currentEditableEl.lastElementChild
        let nextEditableElfirstChild = nextEditableEl.firstElementChild
        

        if(this.currentCaretPosition > currentPageElHeight) {
          if(currentEditableElLastChild.offsetHeight + currentEditableElLastChild.offsetTop > currentPageElHeight && currentEditableElLastChild.offsetTop < currentPageElHeight) {
            let clonedCurrentPageItem=null
            let clonedForNextPage=null
            let childArr=[];
            let index=0;
            let innerEl=null;

            while(currentEditableElHeight > currentPageElHeight){
              
              
              if (clonedForNextPage === null){
                clonedForNextPage=currentEditableElLastChild.cloneNode(true)
              }
              index=0;
              currentEditableElLastChild = currentEditableEl.lastElementChild
              clonedCurrentPageItem=currentEditableElLastChild.cloneNode(true)
              
              
              let tempIndex=clonedCurrentPageItem.childNodes.length-1
              let el = clonedCurrentPageItem.childNodes[tempIndex]
              while ( el.nodeType === 3 ){
                tempIndex--;
                el = clonedCurrentPageItem.childNodes[tempIndex]
              }
              
              innerEl=el
            
          
              function FTN ( el ) {
                if (el.nodeType === 3){
                  return (
                    {
                      flag:true,
                      type:"text"
                    }
                  );
                }
                else if ( el.childNodes.length === 0 ){
                  index++;
                  return (
                    {
                      flag:false,
                      type:"node"
                    }
                  );
                }
                else {
                  
                  let i=el.childNodes.length-1;
                  let a={ flag:false , type:"node" };
                  while (a.flag === false && a.type === "node"){
                    a = FTN ( el.childNodes[i] );
                    if (a.flag === true && a.type === "text"){

                      let Content = el.childNodes[i].textContent.trim().split(" ").filter((element)=>element!=='');
                      let extraContent=Content.pop()
                      let revisedContent=Content.join(" ");
                      el.innerHTML=revisedContent;
                     
                      let temp= childArr[index]===undefined ? extraContent : extraContent + " " + childArr[index];
                      childArr[index]=temp;
                     
                      
                      return ({flag:true , type:"node"});
                      
                    }else if( a.flag === false && a.type === "node"){
                      if (i > 0){
                        i--;
                      }else{
                        return ({flag:false,type:"node"})
                      }
                    } else if ( a.flag === true && a.type === "node"){
                      return ({ flag:true , type:"node"})
                    }
                  }
                }
              }
             
              FTN (innerEl);
              if (clonedCurrentPageItem.innerText.trim().length > 0){
                currentPageEl.replaceChild(clonedCurrentPageItem,currentEditableElLastChild)
              }else{
                currentPageEl.removeChild(currentEditableElLastChild)
              }
              currentEditableElHeight = currentPageEl.lastElementChild ? currentPageEl.lastElementChild.offsetHeight + currentPageEl.lastElementChild.offsetTop: 0
              currentEditableElLastChild = currentPageEl.lastElementChild
              
          }
          if (childArr.length === 0){
            this.moveFocus(nextEditableEl.firstElementChild,0)
          }
          childArr.unshift("asd")
       
          let remChild=[]
          if( clonedForNextPage !== null){
          
            let tempIndex=clonedForNextPage.childNodes.length-1
            let el = clonedForNextPage.childNodes[tempIndex]
            while ( el.nodeType === 3 ){
              tempIndex--;
              el = clonedForNextPage.childNodes[tempIndex]
            }  
            let innerEl=el
         

          function FEN ( el ) {
            if (el.nodeType === 3){
              remChild.push(childArr.pop())
              return (
                {
                  flag:true,
                  type:"text"
                }
              );
            }
            else {
              let i=el.childNodes.length-1;
              let a= { flag:true , type:"node" };
              while (a.flag === true && a.type === "node"){
                if ( i > -1){
                  a= FEN ( el.childNodes[i] );
               }else{
                 return ({flag:true , type:"node"})
               }
                
                if (a.flag === true && a.type === "text"){
                  return ({flag:true , type:"node"}); 
                }else if ( a.flag === true && a.type === "node"){
                    if(childArr.length < 1){
                      el.removeChild(el.childNodes[i]);
                      i--;
                    }else{
                      i--;
                    }
   
                }
              }
            }
          }

          FEN (innerEl);
          function FFN ( el ) {
            if (el.nodeType === 3){
              return (
                {
                  flag:true,
                  type:"text"
                }
              );
            }
            else {
              
              let i=el.childNodes.length-1;
              let a= { flag:true , type:"node" };
              
              
              while (a.flag === true && a.type === "node"){
                if ( i > -1){
                  a= FFN ( el.childNodes[i] );;
               }else{
                 return ({flag:true , type:"node"})
               }
                
                if (a.flag === true && a.type === "text"){

                  let Content = el.childNodes[i].textContent.trim().split(" ").filter((element)=>element!=='');
                  let extraContent=Content.pop()
                  if (remChild[remChild.length-1]==="asd"){
                    remChild.pop()
                  }
                  el.innerHTML=remChild.pop()
                 
                  let temp= childArr[index]===undefined ? extraContent : extraContent + " " + childArr[index];
                
                 
                  
                  return ({flag:true , type:"node"});
                  
                }else if ( a.flag === true && a.type === "node"){
                 
                    
                      i--;
                    
   
                }
              }
            }
          }
          FFN (innerEl);
          }//end if
       
            if (nextEditableEl.childElementCount === 0){
              nextEditableEl.appendChild(clonedForNextPage)
            }else if(nextEditableElfirstChild.innerHTML === "<br>" && nextEditableEl.childElementCount === 1) {
              nextEditableEl.replaceChild(clonedForNextPage, nextEditableElfirstChild)
            } else {
              nextEditableEl.insertBefore(clonedForNextPage, nextEditableElfirstChild)
            }
         
            clonedForNextPage=null;
           
            if (currentEditableElLastChild.innerText.trim().length === 0)
              return this.moveFocus(nextEditableEl.firstElementChild, 0)
            
       
              currentEditableElLastChild = currentPageEl.lastElementChild
    
              if ( fromBack ){
                let tempIndex=currentEditableElLastChild.childNodes.length-1
                let el = currentEditableElLastChild.childNodes[tempIndex]
                while ( el.nodeType !== 3 ){
                  tempIndex--;
                  el = currentEditableElLastChild.childNodes[tempIndex]
                }
              
                this.moveFocus(el,el.length-1)
                fromBack = false
              }
    
          }else{
           
            // currentPageEl.removeChild(currentEditableElLastChild);
            // return this.moveFocus(nextEditableEl.firstElementChild,0)
       
          }

        

        } else {
        
          console.log("Moved content to the next page")
         
          
            let clonedCurrentPageItem=null
            let clonedForNextPage=null
            let childArr=[];
            let index=0;

            while(currentEditableElHeight > currentPageElHeight){
              
              if (clonedForNextPage === null){
                clonedForNextPage=currentEditableElLastChild.cloneNode(true)
              }
              index=0;
              currentEditableElLastChild = currentEditableEl.lastElementChild
             
              clonedCurrentPageItem=currentEditableElLastChild.cloneNode(true)
              let innerEl=null;
              
           
              let tempIndex=clonedCurrentPageItem.childNodes.length-1
              let el = clonedCurrentPageItem.childNodes[tempIndex]
              while ( el.nodeType === 3 ){
                tempIndex--;
                el = clonedCurrentPageItem.childNodes[tempIndex]
              }
              
              innerEl=el
             
              function FTN ( el ) {
                if (el.nodeType === 3){
                  return (
                    {
                      flag:true,
                      type:"text"
                    }
                  );
                }
                else if ( el.childNodes.length === 0 ){
                  index++;
                  return (
                    {
                      flag:false,
                      type:"node"
                    }
                  );
                }
                else {
                  
                  let i=el.childNodes.length-1;
                  let a={ flag:false , type:"node" };
                  while (a.flag === false && a.type === "node"){
                    a = FTN ( el.childNodes[i] );
                    if (a.flag === true && a.type === "text"){

                      let Content = el.childNodes[i].textContent.trim().split(" ").filter((element)=>element!=='');
                      let extraContent=Content.pop()
                      let revisedContent=Content.join(" ");
                      el.innerHTML=revisedContent;
                     
                      let temp= childArr[index]===undefined ? extraContent : extraContent + " " + childArr[index];
                      childArr[index]=temp;
                     
                      
                      return ({flag:true , type:"node"});
                      
                    }else if( a.flag === false && a.type === "node"){
                      if (i > 0){
                        i--;
                      }else{
                        return ({flag:false,type:"node"})
                      }
                    } else if ( a.flag === true && a.type === "node"){
                      return ({ flag:true , type:"node"})
                    }
                  }
                }
              }
             
              FTN (innerEl);

              if (clonedCurrentPageItem.innerText.trim().length > 0){
                currentPageEl.replaceChild(clonedCurrentPageItem,currentEditableElLastChild)
              }else{
                currentPageEl.removeChild(currentEditableElLastChild)
              }
              
              currentEditableElHeight = currentPageEl.lastElementChild ? currentPageEl.lastElementChild.offsetHeight + currentPageEl.lastElementChild.offsetTop: 0
              currentEditableElLastChild = currentPageEl.lastElementChild
           
          } //While
          childArr.unshift("asd")
          
          let remChild=[]
          if( clonedForNextPage !== null){
          
            let tempIndex=clonedForNextPage.childNodes.length-1
            let el = clonedForNextPage.childNodes[tempIndex]
            while ( el.nodeType === 3 ){
              tempIndex--;
              el = clonedForNextPage.childNodes[tempIndex]
            }  
            let innerEl=el

          function FEN ( el ) {
            if (el.nodeType === 3){
              remChild.push(childArr.pop())
              return (
                {
                  flag:true,
                  type:"text"
                }
              );
            }
            else {
              
              let i=el.childNodes.length-1;
              let a= { flag:true , type:"node" };
              
              
              while (a.flag === true && a.type === "node"){
                if ( i > -1){
                  a= FEN ( el.childNodes[i] );;
               }else{
                 return ({flag:true , type:"node"})
               }
                
                if (a.flag === true && a.type === "text"){

                  let Content = el.childNodes[i].textContent.trim().split(" ").filter((element)=>element!=='');
                  let extraContent=Content.pop()
                  let revisedContent=Content.join(" ");
                 
                 
                  let temp= childArr[index]===undefined ? extraContent : extraContent + " " + childArr[index];
                  
                 
                  
                  return ({flag:true , type:"node"});
                  
                }else if ( a.flag === true && a.type === "node"){
                    if(childArr.length < 1){
                      el.removeChild(el.childNodes[i]);
                      i--;
                    }else{
                      i--;
                    }
                }
              }
            }
          }

          FEN (innerEl);
          function FFN ( el ) {
            if (el.nodeType === 3){
              return (
                {
                  flag:true,
                  type:"text"
                }
              );
            }
            else {
              
              let i=el.childNodes.length-1;
              let a= { flag:true , type:"node" };
              
              
              while (a.flag === true && a.type === "node"){
                if ( i > -1){
                  a= FFN ( el.childNodes[i] );;
               }else{
                 return ({flag:true , type:"node"})
               }
                
                if (a.flag === true && a.type === "text"){

                  let Content = el.childNodes[i].textContent.trim().split(" ").filter((element)=>element!=='');
                  let extraContent=Content.pop()
                  
                  if (remChild[remChild.length-1]==="asd"){
                    remChild.pop()
                  }
                  el.innerHTML=remChild.pop()
                 
                  let temp= childArr[index]===undefined ? extraContent : extraContent + " " + childArr[index];
                  
                  
                  return ({flag:true , type:"node"});
                  
                }else if ( a.flag === true && a.type === "node"){
                  i--;
                }
              }
            }
          }
          FFN (innerEl);
          }//end if
         
          if (nextEditableEl.childElementCount === 0){
            nextEditableEl.appendChild(clonedForNextPage)
          }else if(nextEditableElfirstChild.innerHTML === "<br>" && nextEditableEl.childElementCount === 1) {
              nextEditableEl.replaceChild(clonedForNextPage, nextEditableElfirstChild)
            } else {
                  if( currentEditableEl !== nextEditableEl ){
                    if(nextEditableElfirstChild.innerHTML === "<br>"){
                      nextEditableEl.replaceChild(clonedForNextPage, nextEditableElfirstChild)
                    }else{
                      nextEditableEl.insertBefore(clonedForNextPage, nextEditableElfirstChild)
                    }
                  }else{
                    nextEditableEl.appendChild(clonedForNextPage)
                  }
                 

                  if(nextEditableEl.lastElementChild.offsetTop+nextEditableEl.lastElementChild.clientHeight > nextEditableEl.clientHeight){
                    //  pipeline logic when moved from between
                    //  entered from between,space not found
      
                      this.currPageDetails=this.allPages.find((element)=>element.id===currentPageId)
                   
                      if(this.currPageDetails !=null && currentEditableEl!==nextEditableEl){
                        currentPageId=this.currPageDetails.next_page
                        currentPageEl=document.getElementById(`editable_${this.currPageDetails.next_page}`)
                        currentEditableEl=document.getElementById(`editable_${this.currPageDetails.next_page}`)
                        currentEditableElId=`editable_${this.currPageDetails.next_page}`
                        
                      }
      
                     
                      this.nextPageDetails=this.allPages.find((element)=>element.id===nextPageId)
                      

                      if(this.nextPageDetails !== undefined && this.nextPageDetails.next_page !== null){
                      
                        nextEditableElId=`editable_${this.nextPageDetails.next_page}`
                        nextPageId=this.nextPageDetails.next_page;
                        nextEditableEl=document.getElementById(nextEditableElId)
                        
                        this.moveFocus(nextEditableEl.lastElementChild,1)
                        selection=window.getSelection()
                        
                        if(selection.anchorNode.offsetTop === undefined) {
                            this.currentCaretPosition = selection.anchorNode.parentNode ? selection.anchorNode.parentNode.offsetTop + selection.anchorNode.parentNode.offsetHeight: 0
                          } else {
                            this.currentCaretPosition = selection.anchorNode ? selection.anchorNode.offsetTop + selection.anchorNode.offsetHeight: 0
                          }
                      }else{
                        const lastpage= currentEditableEl!==nextEditableEl ? document.getElementById(`editable_${nextPageId}`) : document.getElementById(`editable_${currentPageId}`)
                        this.bufferContent = ( lastpage.lastElementChild.innerText.trim().length > 0 ? lastpage.lastElementChild.innerText.trim() + " " : "" ) + this.bufferContent
                        lastpage.removeChild(lastpage.lastElementChild)
                        this.moveFocus(enteredTriggeredLoc,0)
                        spaceFound=true
                        console.log(this.bufferContent)
                      }
                    
                  }else{
                    //break loop
                    this.moveFocus(enteredTriggeredLoc,0)
                    spaceFound=true
                  }
            }
            clonedForNextPage=null;
        }
      }else{
        spaceFound=true;
      
        if(fromBack){
          this.moveFocus(currentPageEl.lastElementChild,0)
          fromBack = false
        }
      }
    }
    j++;
  }//end while
    this.previousCaretPosition = this.currentCaretPosition
  }

  render() {
    const { tagName ='div', html = "", innerRef, page, style, ...props } = this.props;

    return React.createElement(
      tagName,
      {
        ...props,
        ref: typeof innerRef === 'function' ? (current) => {
          innerRef(current)
          this.el.current = current
        } : innerRef || this.el,
        onClick: this.emitKeyup,
        onInput: this.emitKeyup,
        onKeyDown: this.emitKeyup,
        contentEditable: !this.props.disabled,
        dangerouslySetInnerHTML: { __html: this.props.page.prev_page===null ? `<p class="western" lang="en" style="text-align: center;" align="center">
        <span style="font-family: 'Crimson Text'; color: rgb(0, 0, 0);"
          ><span style="font-size: x-large;"
            ><em
              ><strong
                >Case Studies of Homes <br />My Team Sold that Other <br />Agents
                Couldn&rsquo;t Sell</strong
              ></em
            ></span
          ></span
        >
      </p>
      <p class="western" lang="en" style="text-align: left;">
        <span style="font-family: 'Crimson Text'; color: rgb(0, 0, 0);"
          ><span style="font-size: medium;"
            >Each of the case studies below is a house that another agent failed to
            sell&hellip; that I listed&hellip; and successfully sold.
          </span></span
        >
      </p>
      <p class="western" lang="en" style="text-align: left;">
        <span style="color: rgb(0, 0, 0);"
          ><span style="font-family: Crimson Text;"
            ><span style="font-size: medium;"
              ><strong>Case Study #1: </strong></span
            ></span
          ><span style="font-family: Crimson Text;"
            ><span style="font-size: medium;"
              >Home was for sale for about a year with two different Realtors. The
              seller hired me, and I sold it in a few weeks for the previous
              agent&rsquo;s price.
            </span></span
          ></span
        >
      </p>
      <p class="western" lang="en" style="text-align: left;">
        <span style="color: rgb(0, 0, 0);"
          ><span style="font-family: Crimson Text;"
            ><span style="font-size: medium;"
              ><strong>Case Study #2: </strong></span
            ></span
          ><span style="font-family: Crimson Text;"
            ><span style="font-size: medium;"
              >Home was for sale for a year with 2 Realtors&hellip; and didn&rsquo;t
              sell. I put the home on the market a month after the listing expired
              with the last agent. The seller left the same asking price. It sold in 2
              weeks for 97% of the asking price.</span
            ></span
          ></span
        >
      </p>
   
      
       `: html},
        style
      },
    this.props.children);
  }
}