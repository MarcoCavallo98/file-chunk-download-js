using ChunkDownload.Models;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using System.ComponentModel.DataAnnotations;
using System.Net.Mime;
using System.Security.Cryptography;

namespace ChunkDownloadJS.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DownloadController : ControllerBase
    {
        // Contants (this values are only for test purposes: change them as you need)
        private const int MIN_CHUNK_SIZE = 100 * 1024; // 100KB
        private const int MAX_CHUNK_SIZE = 5 * 1024 * 1024; // 5MB

        // Array of bytes to simulate a file
        private readonly byte[] _testFisrt = Enumerable.Repeat((byte)0x51, 22 * 1024 * 1024).ToArray(); // 22MB
        private readonly byte[] _testSecond = Enumerable.Repeat((byte)0x52, 8 * 1024 * 1024).ToArray(); // 8MB


        [HttpPost("chunk")]
        [ProducesResponseType(typeof(ChunkDownloadResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status500InternalServerError)]
        public IActionResult GetChunk([FromBody] ChunkDownloadRequest chunkDownloadRequest)
        {
            try
            {
                // Adjust the chunk size
                int chunkSize = AdjustChunkSize(chunkDownloadRequest.ChunkSize);

                // Check if the file exists
                if (chunkDownloadRequest.FileName != "test_first.txt" && chunkDownloadRequest.FileName != "test_second.txt")
                {
                    return BadRequest(new ErrorResponse { Message = "Request FileName must be test_first.txt or test_second.txt" });
                }

                byte[] requestedFile = chunkDownloadRequest.FileName == "test_first.txt" ? _testFisrt : _testSecond;

                // Check if the chunk required is beyond the file size
                if (chunkDownloadRequest.Offset >= requestedFile.Length)
                {
                    return BadRequest(new ErrorResponse { Message = "ChunkPosition is greather than the size of the requested file" });
                }

                int offset = chunkDownloadRequest.Offset.Value;
                bool isLastChunk = chunkSize + offset >= requestedFile.Length; // Check if it is the last chunk
                int currentChunkSize = isLastChunk ? requestedFile.Length - offset : chunkSize; // Compute the correct chunk size

                byte[] buffer = new byte[currentChunkSize];
                Array.Copy(requestedFile, offset, buffer, 0, buffer.Length);

                var response = new ChunkDownloadResponse { Data = buffer, ChunkSize = buffer.Length };

                // If this is the last chunk return the MD5 of the file
                if (isLastChunk)
                {
                    response.Md5 = ComputeMD5(requestedFile);
                }

                // Sleep for simulating a slow connection
                Thread.Sleep(new Random().Next(4000));

                return Ok(response);

            }
            catch (Exception)
            {
                return new ContentResult
                {
                    StatusCode = StatusCodes.Status500InternalServerError,
                    ContentType = MediaTypeNames.Application.Json,
                    Content = JsonConvert.SerializeObject(new ErrorResponse { Message = "Internal error" })
                };
            }

        }


        /// <summary>
        /// This method check the chunk size recived from the client and adjust it basing om the <see cref="MIN_CHUNK_SIZE"/>
        /// and <see cref="MAX_CHUNK_SIZE"/>. If it has no value, <see cref="MIN_CHUNK_SIZE"/> is returned
        /// </summary>
        /// <param name="chunkSizeFromClient"></param>
        /// <returns></returns>
        private int AdjustChunkSize(int? chunkSizeFromClient)
        {
            if (!chunkSizeFromClient.HasValue || chunkSizeFromClient < MIN_CHUNK_SIZE) return MIN_CHUNK_SIZE;
            else if (chunkSizeFromClient > MAX_CHUNK_SIZE) return MAX_CHUNK_SIZE;
            else return chunkSizeFromClient.Value;
        }


        private string ComputeMD5(byte[] input)
        {
            using (MD5 md5 = MD5.Create())
            {
                return Convert.ToBase64String(md5.ComputeHash(input));
            }
        }
    }
}
