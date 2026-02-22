import React, { use, useCallback, useEffect, useState} from 'react'
import Quill from 'quill'
import "quill/dist/quill.snow.css"
import {io} from 'socket.io-client'
import { useParams } from 'react-router-dom'

const toolbarOptions = [
  [{ header: [1, 2, 3, 4, 5, 6, false] }],
  [{ font: [] }],
  [{ list: "ordered" }, { list: "bullet" }],
  ["bold", "italic", "underline"],
  [{ color: [] }, { background: [] }],
  [{ script: "sub" }, { script: "super" }],
  [{ align: [] }],
  ["image", "blockquote", "code-block"],
  ["clean"],
]

export default function Text() {
  const {id: documentId} = useParams()
  const [socket, setSocket] = useState()
  const [quill, setQuill] = useState()

  useEffect(() => {
    const s = io(process.env.REACT_APP_SERVER_URL)
    setSocket(s)
    return () => {s.disconnect()}
  }, [])  

  useEffect(() => {
    if(socket == null || quill == null) return
    socket.once('load-document', document => {
      quill.setContents(document)
      quill.enable()
    })
    socket.emit('get-document', documentId)
  },[socket, quill, documentId])

  useEffect(() => {
    if(socket == null || quill == null) return

    socket.on('receive-change', (delta) => {
      quill.updateContents(delta)
    })
    return () => {socket.off('receive-change')}
  }, [socket, quill])

  useEffect(() => {
    if(socket == null || quill == null) return
    const interval = setInterval(() => {
      socket.emit('save-document', quill.getContents())
    }, 2000)
    return () => {clearInterval(interval)}
  }, [socket, quill])

  useEffect(() => {
    if(socket == null || quill == null) return
    const handler = (delta, oldDelta, source) => {
      if(source !== 'user') return
      socket.emit('send-change', delta)
    }
    quill.on('text-change', handler)
    return () => {quill.off('text-change', handler)}
  }, [socket, quill])
  

  const  wrapped = useCallback((wrapper) => {
    if(wrapper == null) return

    wrapper.innerHTML = ''
    const editor = document.createElement('div')
    wrapper.append(editor) 
    const q  = new Quill(editor, {
      theme: 'snow',
      modules: {toolbar: toolbarOptions}
      })
    q.disable()
    q.setText('Loading...')
    setQuill(q) 
  }, [])
  return <div className="container" ref={wrapped}></div>
}
