using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;

namespace ChunkDownload.Models
{
    public class ChunkDownloadRequest
    {
        [Required]
        public string FileName { get; set; }

        [Required]
        public int? Offset { get; set; }
        
        public int? ChunkSize { get; set; }
    }
}
