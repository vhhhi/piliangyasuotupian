document.addEventListener('DOMContentLoaded', function() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const previewContainer = document.getElementById('previewContainer');
    const originalPreview = document.getElementById('originalPreview');
    const compressedPreview = document.getElementById('compressedPreview');
    const originalSize = document.getElementById('originalSize');
    const compressedSize = document.getElementById('compressedSize');
    const qualitySlider = document.getElementById('quality');
    const qualityValue = document.getElementById('qualityValue');
    const downloadBtn = document.getElementById('downloadBtn');
    const batchPreviewList = document.getElementById('batchPreviewList');
    const imageList = document.getElementById('imageList');
    const batchQualitySlider = document.getElementById('batchQuality');
    const batchQualityValue = document.getElementById('batchQualityValue');
    const compressAllBtn = document.getElementById('compressAllBtn');
    const downloadAllBtn = document.getElementById('downloadAllBtn');

    let originalFile = null;
    let imageFiles = new Map(); // 存储所有待处理的图片

    // 上传区域点击事件
    uploadArea.addEventListener('click', () => fileInput.click());

    // 文件拖拽事件
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = '#007AFF';
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.style.borderColor = '#d2d2d7';
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = '#d2d2d7';
        const files = Array.from(e.dataTransfer.files).filter(file => 
            file.type.match('image.*')
        );
        
        if (files.length === 0) return;
        
        if (files.length === 1) {
            handleSingleFile(files[0]);
        } else {
            handleMultipleFiles(files);
        }
    });

    // 文件选择事件
    fileInput.addEventListener('change', (e) => {
        const files = Array.from(e.target.files).filter(file => 
            file.type.match('image.*')
        );
        
        if (files.length === 0) return;
        
        if (files.length === 1) {
            handleSingleFile(files[0]);
        } else {
            handleMultipleFiles(files);
        }
    });

    // 压缩图片函数
    function compressImage(file, quality) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;

                const ctx = canvas.getContext('2d');
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(img, 0, 0, img.width, img.height);

                canvas.toBlob((blob) => {
                    if (!blob) {
                        console.error('压缩失败');
                        return;
                    }
                    
                    compressedPreview.src = URL.createObjectURL(blob);
                    compressedSize.textContent = formatFileSize(blob.size);
                    
                    downloadBtn.onclick = () => {
                        const link = document.createElement('a');
                        link.href = URL.createObjectURL(blob);
                        const ext = 'jpg';
                        link.download = `compressed_${file.name.split('.')[0]}.${ext}`;
                        link.click();
                    };
                }, 'image/jpeg', quality);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    // 异步压缩图片函数
    function compressImageAsync(file, quality) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;

                    const ctx = canvas.getContext('2d');
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';
                    ctx.drawImage(img, 0, 0, img.width, img.height);

                    canvas.toBlob((blob) => {
                        if (!blob) {
                            reject(new Error('压缩失败'));
                            return;
                        }
                        resolve({
                            url: URL.createObjectURL(blob),
                            size: blob.size
                        });
                    }, 'image/jpeg', quality);
                };
                img.onerror = () => reject(new Error('图片加载失败'));
                img.src = e.target.result;
            };
            reader.onerror = () => reject(new Error('文件读取失败'));
            reader.readAsDataURL(file);
        });
    }

    // 修改质量滑块事件
    qualitySlider.addEventListener('input', (e) => {
        const quality = e.target.value / 100;
        qualityValue.textContent = e.target.value + '%';
        if (originalFile) {
            compressImage(originalFile, quality);
        }
    });

    // 处理单个文件
    function handleSingleFile(file) {
        originalFile = file;
        batchPreviewList.style.display = 'none';
        previewContainer.style.display = 'block';
        
        originalSize.textContent = formatFileSize(file.size);
        const reader = new FileReader();
        reader.onload = (e) => {
            originalPreview.src = e.target.result;
            compressImage(file, qualitySlider.value / 100);
        };
        reader.readAsDataURL(file);
    }

    // 处理多个文件
    function handleMultipleFiles(files) {
        batchPreviewList.style.display = 'block';
        previewContainer.style.display = 'none';
        imageList.innerHTML = '';
        imageFiles.clear();

        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const id = Date.now() + Math.random();
                imageFiles.set(id, {
                    file,
                    original: e.target.result,
                    compressed: null,
                    status: 'pending'
                });
                
                addImageToList(id, e.target.result, file);
            };
            reader.readAsDataURL(file);
        });
    }

    // 添加图片到列表
    function addImageToList(id, src, file) {
        const item = document.createElement('div');
        item.className = 'image-item';
        item.dataset.id = id;
        
        item.innerHTML = `
            <img src="${src}" alt="预览图" class="preview-image">
            <div class="item-info">
                <div>文件名：${file.name}</div>
                <div>原始大小：${formatFileSize(file.size)}</div>
                <div class="compressed-size"></div>
            </div>
            <div class="item-actions">
                <span class="status">待压缩</span>
                <button class="download-single-btn" style="display: none;">下载此图片</button>
            </div>
        `;
        
        const downloadBtn = item.querySelector('.download-single-btn');
        downloadBtn.addEventListener('click', () => {
            const imageData = imageFiles.get(id);
            if (imageData && imageData.compressed) {
                const link = document.createElement('a');
                link.href = imageData.compressed;
                const ext = 'jpg';
                link.download = `compressed_${imageData.file.name.split('.')[0]}.${ext}`;
                link.click();
            }
        });
        
        imageList.appendChild(item);
    }

    // 批量压缩按钮事件
    compressAllBtn.addEventListener('click', async () => {
        const quality = batchQualitySlider.value / 100;
        compressAllBtn.disabled = true;
        downloadAllBtn.disabled = true;
        
        try {
            for (const [id, data] of imageFiles) {
                const item = document.querySelector(`.image-item[data-id="${id}"]`);
                const statusElement = item.querySelector('.status');
                const compressedSizeElement = item.querySelector('.compressed-size');
                const downloadBtn = item.querySelector('.download-single-btn');
                
                try {
                    statusElement.textContent = '压缩中...';
                    const result = await compressImageAsync(data.file, quality);
                    
                    imageFiles.get(id).compressed = result.url;
                    imageFiles.get(id).status = 'compressed';
                    imageFiles.get(id).compressedSize = result.size;
                    
                    compressedSizeElement.textContent = `压缩后：${formatFileSize(result.size)}`;
                    statusElement.className = 'status compressed';
                    statusElement.textContent = '已压缩';
                    downloadBtn.style.display = 'block';
                } catch (error) {
                    console.error('压缩失败:', error);
                    statusElement.textContent = '压缩失败';
                    statusElement.style.backgroundColor = '#ff4444';
                }
            }
        } finally {
            compressAllBtn.disabled = false;
            downloadAllBtn.disabled = false;
        }
    });

    // 批量下载按钮事件
    downloadAllBtn.addEventListener('click', async () => {
        const zip = new JSZip();
        let hasCompressedFiles = false;
        const folder = zip.folder("compressed_images");
        
        for (const [id, data] of imageFiles) {
            if (data.status !== 'compressed') continue;
            
            try {
                const response = await fetch(data.compressed);
                const blob = await response.blob();
                const fileName = `compressed_${data.file.name.split('.')[0]}.jpg`;
                folder.file(fileName, blob);
                hasCompressedFiles = true;
            } catch (error) {
                console.error('添加文件到压缩包失败:', error);
            }
        }

        if (!hasCompressedFiles) {
            alert('没有可下载的压缩图片！');
            return;
        }

        try {
            const content = await zip.generateAsync({type: 'blob'});
            const link = document.createElement('a');
            link.href = URL.createObjectURL(content);
            link.download = `compressed_images_${new Date().getTime()}.zip`;
            link.click();
        } catch (error) {
            console.error('生成压缩包失败:', error);
            alert('生成压缩包失败，请重试！');
        }
    });

    // 批量压缩质量滑块事件
    batchQualitySlider.addEventListener('input', (e) => {
        batchQualityValue.textContent = `${e.target.value}%`;
    });

    // 格式化文件大小
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}); 