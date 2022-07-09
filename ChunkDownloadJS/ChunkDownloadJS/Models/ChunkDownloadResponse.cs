using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ChunkDownload.Models
{
    public class ChunkDownloadResponse
    {
        public byte[] Data { get; set; }
        public int ChunkSize { get; set; }
        public string Md5 { get; set; }
    }
}
