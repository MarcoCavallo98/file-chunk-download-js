# file-chunk-download-js
 A simple example on how dowloading files with chunks.

## Description
This demo is written in .NET 6 and pure Javascript. You will find a basic API which serves chubk to a client and
some Javascript code which downlaod the chunks from the API using the [showSaveFilePicker](https://developer.mozilla.org/en-US/docs/Web/API/Window/showSaveFilePicker) and the [FileSystemWritableFileStream](https://developer.mozilla.org/en-US/docs/Web/API/FileSystemWritableFileStream)
API.

*** IMMPORTANT: the client side code works only on Chrome and Edge in a secure context ***
