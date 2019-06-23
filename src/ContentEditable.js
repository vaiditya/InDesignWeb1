import React, { Component } from "react";
import PropTypes from "prop-types"
import { functionTypeAnnotation } from "@babel/types";

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
    const currentPageEl = this.getEl();
    if (!currentPageEl) return;

    const selection = window.getSelection();
    if(selection.anchorNode.offsetTop === undefined) {
      this.currentCaretPosition = selection.anchorNode.parentNode ? selection.anchorNode.parentNode.offsetTop + selection.anchorNode.parentNode.offsetHeight: 0
    } else {
      this.currentCaretPosition = selection.anchorNode ? selection.anchorNode.offsetTop + selection.anchorNode.offsetHeight: 0
    }
    console.log("this.currentCaretPosition",this.currentCaretPosition)

    // if(e.keyCode === 8) {
    //   if(selection.anchorNode.offsetTop !== undefined && selection.anchorNode.offsetTop === 0) {
    //     e.preventDefault()
    //     const previousEditableEl = document.getElementById("editable_ucd")
    //     previousEditableEl.focus()
    //     this.moveFocus(previousEditableEl, previousEditableEl.childElementCount - 1, true)
    //   } else {
    //     if(selection.anchorNode.offsetTop === undefined) {
    //       console.log("parentNode: ", selection.anchorNode.parentNode.offsetTop)
    //       // if user have typed something and reached to the first line by erasing all the words
    //       if(selection.anchorOffset - 1 === 0 && selection.anchorNode.parentNode.offsetTop === 0) {
    //         e.preventDefault()
    //         const previousEditableEl = document.getElementById("editable_ucd")
    //         console.log("Remove node from child and append it to parent ...!")
    //         if(currentPageEl.childElementCount === 1) {
    //           currentPageEl.innerHTML = "<div><br></div>"
    //         } else {
    //           currentPageEl.removeChild(currentPageEl.firstChild)
    //         }
    //         previousEditableEl.focus()
    //         this.moveFocus(previousEditableEl, previousEditableEl.childElementCount, false)
    //       // if user have typed something and taken cursor back to start position on first line
    //       } else if(selection.anchorOffset - 1 === -1 && selection.anchorNode.parentNode.offsetTop === 0) {
    //         e.preventDefault()
    //         console.log("Remove text from behind the cursor and append it to the parent ...!")
    //         const previousEditableEl = document.getElementById("editable_ucd")
    //         const currentFirstChildNode = currentPageEl.firstChild
    //         previousEditableEl.appendChild(currentFirstChildNode)
    //         if(currentPageEl.childElementCount === 0) {
    //           currentPageEl.innerHTML = "<div><br></div>"
    //         }
    //         previousEditableEl.focus()
    //         this.moveFocus(previousEditableEl, previousEditableEl.childElementCount - 1, true)
    //       }
    //     } else {
    //       console.log("anchorNode: ", selection.anchorNode.offsetTop)
    //       // Not having any parent nodes : ideally first page of the document
    //       if(selection.anchorNode.offsetTop === 0) {
    //         e.preventDefault()
    //       }
    //     }
    //   }
    // }

    if(this.currentCaretPosition !== this.previousCaretPosition) {
      const currentPageElHeight = currentPageEl.clientHeight

      // Current Editable reference
      const currentEditableEl = document.getElementById(`editable_${this.props.page.id}`)
      let currentEditableElHeight = currentPageEl.lastElementChild ? currentPageEl.lastElementChild.offsetHeight + currentPageEl.lastElementChild.offsetTop: 0
      console.log("currentEditableElHeight",currentEditableElHeight)
      console.log("currentPageElHeight",currentPageElHeight)
      // Next Editable reference
      const nextEditableEl = document.getElementById("editable_u16b")
      const nextEditableElHeight = nextEditableEl.clientHeight
      
      let currentPageItem = []
      let nextPageItem = []


      if(currentEditableElHeight > currentPageElHeight) {
        
        let currentEditableElLastChild = currentEditableEl.lastElementChild
        let nextEditableElfirstChild = nextEditableEl.firstElementChild

        if(this.currentCaretPosition > currentPageElHeight) {
         
          if(currentEditableElLastChild.offsetHeight + currentEditableElLastChild.offsetTop > currentPageElHeight && currentEditableElLastChild.offsetTop < currentPageElHeight) {
            
            let extraContent=""
            let clonedCurrentPageItem=null
            let parentEl=null;
            let i=0;

            while(currentEditableElHeight>currentPageElHeight){

              currentEditableElLastChild = currentEditableEl.lastElementChild
              // console.log("currentPageItem",currentEditableElLastChild)
              clonedCurrentPageItem=currentEditableElLastChild.cloneNode(true)
            

              let innerEl=null;
              parentEl=null;
              
              innerEl=clonedCurrentPageItem.childNodes[clonedCurrentPageItem.childNodes.length-2]
              console.log(innerEl.childNodes[innerEl.childNodes.length-1])
              let outerWhile=false
              while(!outerWhile){
                while (innerEl.nodeType !== 3 && innerEl.childNodes.length > 0){
                  parentEl=innerEl
                  innerEl=innerEl.childNodes[innerEl.childNodes.length-1]
                  // console.log("in while",innerEl.nodeType,innerEl)  
                }
                if( innerEl.nodeType !== 3 && innerEl.childNodes.length === 0){
                  i++;
                  console.log("child got empty",parentEl.previousSibling,innerEl)
                  innerEl=parentEl.previousSibling
                  console.log("extraContent1",extraContent)
                  // extraContentArr.push(extraContent);
                  extraContent=''
                }else{
                  outerWhile=true
                }
              }
              
              // console.log("parentEl",parentEl.parentElement)
              // console.log("innerEl",innerEl)
              // console.log("innerElArr",innerEl.textContent.trim().split(" ").filter((element)=>element!==''))

              let innerElArr=innerEl.textContent.trim().split(" ").filter((element)=>element!=='')
              extraContent=innerElArr.pop()+" "+extraContent
              let revisedContent=innerElArr.join(" ");
              // console.log("revisedContent",revisedContent)

              parentEl.innerHTML=revisedContent
              // console.log("parentEl",parentEl)
              // console.log("clonedCurrentPageItem",clonedCurrentPageItem)

              currentPageEl.replaceChild(clonedCurrentPageItem,currentEditableElLastChild)

              // console.log("currentPageElHeight",currentPageEl.clientHeight)
              currentEditableElHeight = currentPageEl.lastElementChild ? currentPageEl.lastElementChild.offsetHeight + currentPageEl.lastElementChild.offsetTop: 0
              // console.log("currentEditableElHeight",currentEditableElHeight)
              currentEditableElLastChild = currentPageEl.lastElementChild
              
          }
            let extraInnerEl=null;
            let extraParentEl=null;
            let clonedCurrentPageItemExtra=clonedCurrentPageItem.cloneNode(true)
            // console.log("extra Content : ",extraContent)

            extraInnerEl=clonedCurrentPageItemExtra.childNodes[clonedCurrentPageItemExtra.childNodes.length-2]
            console.log(extraInnerEl.childNodes[extraInnerEl.childNodes.length-1])
            
            while (extraInnerEl.nodeType !== 3 ){
              extraParentEl=extraInnerEl
              extraInnerEl=extraInnerEl.childNodes[extraInnerEl.childNodes.length-1]
              // console.log("in while",extraInnerEl.nodeType)  
            }
            extraParentEl.innerHTML=extraContent
            // console.log("clonedCurrentPageItem",clonedCurrentPageItemExtra)


            if(nextEditableElfirstChild.innerHTML === "<br>" && nextEditableEl.childElementCount === 1) {
              nextEditableEl.replaceChild(clonedCurrentPageItemExtra, nextEditableElfirstChild)
            } else {
              nextEditableEl.insertBefore(clonedCurrentPageItemExtra, nextEditableElfirstChild)
            }

            // return this.moveFocus(clonedCurrentPageItemExtra, 0)
          }else{
            //currentEditableElLastChild.offsetTop > currentPageElHeight
            
            currentPageEl.removeChild(currentEditableElLastChild);
            this.moveFocus(nextEditableEl.firstElementChild,0)
            currentEditableElLastChild=currentPageEl.lastElementChild
          }

          // if(nextEditableElfirstChild.innerHTML === "<br>" && nextEditableEl.childElementCount === 1) {
          //   nextEditableEl.replaceChild(currentEditableElLastChild, nextEditableElfirstChild)
          //   nextEditableEl.focus()
          // } else {
          //   nextEditableEl.insertBefore(currentEditableElLastChild, nextEditableElfirstChild)
          //   nextEditableEl.focus()
          // } 

        } else {
          console.log("currentEditableElLastChild",currentEditableElLastChild)
          console.log("nextEditableElfirstChild",nextEditableElfirstChild)
          console.log("Moved content to the next page")
          // nextEditableEl.insertBefore(currentEditableElLastChild, nextEditableElfirstChild)
          let extraContent="";
          
            let clonedCurrentPageItem=null
            let clonedForNextPage=null
            let parentEl=null;
            let parentArr=[];
            let childArr=[];
            let index=0;

            while(currentEditableElHeight > currentPageElHeight){

              if (clonedForNextPage === null){
                clonedForNextPage=currentEditableElLastChild.cloneNode(true)
              }
              index=0;
              currentEditableElLastChild = currentEditableEl.lastElementChild
              console.log("currentPageItem",currentEditableElLastChild)
              clonedCurrentPageItem=currentEditableElLastChild.cloneNode(true)
              

              let innerEl=null;
              parentEl=null;
              
              innerEl=clonedCurrentPageItem.childNodes[clonedCurrentPageItem.childNodes.length-2]
              console.log("clonedCurrentPageItem",clonedCurrentPageItem)
              console.log(innerEl.childNodes[innerEl.childNodes.length-1])
              
              let outerWhile=false
              // while(!outerWhile){
              //   console.log("outer while",i)
              //   while (innerEl.nodeType !== 3 && innerEl.childNodes.length > 0 ){
              //     parentEl=innerEl
              //     console.log("innerEl",innerEl.childNodes.length)
              //     console.log("in while",innerEl.nodeType)
              //     innerEl=innerEl.childNodes[innerEl.childNodes.length-1]
              //   }
              //   if( innerEl.nodeType !== 3 && innerEl.childNodes.length === 0){
              //     i++;
              //     console.log("child got empty",parentEl.previousSibling,innerEl)
              //     innerEl=parentEl.previousSibling
              //     console.log("extraContent1",extraContent)
              //     // extraContentArr.push(extraContent);
              //     extraContent=''
              //   }else{
              //     outerWhile=true
              //   }
                
              // }
              
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
             
              let res=FTN (innerEl);
              console.log("childarr",childArr)
              console.log("revisedEl",innerEl)

              


              
              // console.log("innerElArr",innerEl.textContent.trim().split(" ").filter((element)=>element!==''))

              // let innerElArr=innerEl.textContent.trim().split(" ").filter((element)=>element!=='')
              // extraContent=innerElArr.pop()
              // let revisedContent=innerElArr.join(" ");
              // console.log("revisedContent",revisedContent)

              // parentEl.innerHTML=revisedContent
              // console.log("parentEl",parentEl)
              // console.log("clonedCurrentPageItem",clonedCurrentPageItem)

              currentPageEl.replaceChild(clonedCurrentPageItem,currentEditableElLastChild)

              // console.log("currentPageElHeight",currentPageEl.clientHeight)
              currentEditableElHeight = currentPageEl.lastElementChild ? currentPageEl.lastElementChild.offsetHeight + currentPageEl.lastElementChild.offsetTop: 0
              // console.log("currentEditableElHeight",currentEditableElHeight)
              currentEditableElLastChild = currentPageEl.lastElementChild

              // if(extraContentArr.length===0){
              //   let a=extraContentArr[i]
              //   let b=extraContent+" "+(a !== undefined ? a : "")
              //   extraContentArr[i]=b
              //   i=0;
              // }else{
              //   console.log("extraContentArr.length-1",extraContentArr.length-1)
              //   let a=extraContentArr[i]
              //   let b=extraContent+" "+(a !== undefined ? a : "")
              //   extraContentArr[i]=b
              //   i=0;
              // }
              // console.log("extraContentArr",extraContentArr)
           
          } //While
          childArr.unshift("asd")
          console.log("cA.l",childArr)
          let remChild=[]
          if( clonedForNextPage !== null){
          
          let innerEl=clonedForNextPage.childNodes[clonedForNextPage.childNodes.length-2]

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
                  // el.innerHTML=revisedContent;
                 
                  let temp= childArr[index]===undefined ? extraContent : extraContent + " " + childArr[index];
                  // childArr[index]=temp;
                 
                  
                  return ({flag:true , type:"node"});
                  
                }else if ( a.flag === true && a.type === "node"){
                  console.log("chilArr.length",childArr.length)
                    if(childArr.length < 1){
                      console.log("chilArr.length",childArr.length)
                      el.removeChild(el.childNodes[i]);
                      i--;
                    }else{
                      i--;
                    }
   
                }
              }
            }
          }

          let res=FEN (innerEl);
            
          console.log("revisedEl",innerEl)
          console.log("childArr",childArr)
          console.log("remChild",remChild)

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
                  let revisedContent=Content.join(" ");
                  if (remChild[remChild.length-1]==="asd"){
                    remChild.pop()
                  }
                  el.innerHTML=remChild.pop()
                 
                  let temp= childArr[index]===undefined ? extraContent : extraContent + " " + childArr[index];
                  // childArr[index]=temp;
                 
                  
                  return ({flag:true , type:"node"});
                  
                }else if ( a.flag === true && a.type === "node"){
                  console.log("chilArr.length",childArr.length)
                    
                      i--;
                    
   
                }
              }
            }
          }
           res=FFN (innerEl);
            
          console.log("revisedEl",innerEl)
          console.log("childArr",childArr)
          console.log("remChild",remChild)


          }//end if
          console.log("clonedForNextPage",clonedForNextPage)


          
            
            // let extraInnerEl=null;
            // let extraParentEl=null;
            // let clonedCurrentPageItemExtra=clonedCurrentPageItem.cloneNode(true)
            // console.log("extra Content : ",extraContent)

            // extraInnerEl=clonedCurrentPageItemExtra.childNodes[clonedCurrentPageItemExtra.childNodes.length-2]
            // console.log(extraInnerEl.childNodes[extraInnerEl.childNodes.length-1])
            
            // while (extraInnerEl.nodeType !== 3 && extraInnerEl.childNodes.length > 0){
            //   extraParentEl=extraInnerEl
            //   extraInnerEl=extraInnerEl.childNodes[extraInnerEl.childNodes.length-1]
            //   console.log("in while",extraInnerEl.nodeType)  
            // }

            // let ancEl=extraParentEl.parentElement
            // let j=extraContentArr.length-1
            // while(j>-1){
            // ancEl.childNodes[extraContentArr.length-j-1].innerHTML=extraContentArr[j];
            // j--;
            // }
            // // extraParentEl.innerHTML=extraContentArr[0]

            // console.log("clonedCurrentPageItem",clonedCurrentPageItemExtra)


            if(nextEditableElfirstChild.innerHTML === "<br>" && nextEditableEl.childElementCount === 1) {
              nextEditableEl.replaceChild(clonedForNextPage, nextEditableElfirstChild)
            } else {
              nextEditableEl.insertBefore(clonedForNextPage, nextEditableElfirstChild)
            }
            clonedForNextPage=null;

        }
      }else{
        
      }
    }

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