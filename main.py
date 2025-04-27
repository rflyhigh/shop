import streamlit as st
import os
import base64
import pandas as pd
from pathlib import Path

st.set_page_config(page_title="File Content Viewer", layout="wide")

st.title("File Content Viewer")
st.write("Select files or a folder to view and copy their contents")

# Initialize session state for storing file contents
if "file_contents" not in st.session_state:
    st.session_state.file_contents = {}

tab1, tab2 = st.tabs(["Select Files", "Select Folder"])

# Function to read file content
def read_file_content(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return f.read()
    except UnicodeDecodeError:
        try:
            with open(file_path, 'r', encoding='latin-1') as f:
                return f.read()
        except:
            return f"Error: Could not read {file_path}. This might be a binary file."
    except Exception as e:
        return f"Error reading {file_path}: {str(e)}"

# File selector
with tab1:
    uploaded_files = st.file_uploader("Choose files", accept_multiple_files=True)
    if uploaded_files:
        st.session_state.file_contents = {}
        for uploaded_file in uploaded_files:
            # Read content from uploaded file
            content = uploaded_file.read()
            try:
                # Try to decode as text
                text_content = content.decode('utf-8')
                st.session_state.file_contents[uploaded_file.name] = text_content
            except UnicodeDecodeError:
                # If it's not text, just indicate it's binary
                st.session_state.file_contents[uploaded_file.name] = f"[Binary file: {uploaded_file.name}]"

# Folder selector
with tab2:
    folder_path = st.text_input("Enter folder path")
    process_folder = st.button("Process Folder")
    
    if process_folder and folder_path:
        if os.path.isdir(folder_path):
            st.session_state.file_contents = {}
            files = [os.path.join(dp, f) for dp, dn, filenames in os.walk(folder_path) for f in filenames]
            progress_bar = st.progress(0)
            
            for i, file_path in enumerate(files):
                # Update progress bar
                progress_bar.progress((i + 1) / len(files))
                
                # Skip very large files
                if os.path.getsize(file_path) > 10 * 1024 * 1024:  # 10MB limit
                    st.session_state.file_contents[file_path] = f"[File too large: {file_path}]"
                    continue
                
                content = read_file_content(file_path)
                st.session_state.file_contents[file_path] = content
            
            progress_bar.empty()
            st.success(f"Processed {len(files)} files from folder")
        else:
            st.error("Invalid folder path")

# Display file contents
if st.session_state.file_contents:
    st.header("File Contents")
    
    # Combine all contents with file names
    all_content = ""
    for file_name, content in st.session_state.file_contents.items():
        file_content = f"### FILE: {file_name}\n{content}\n\n"
        all_content += file_content
    
    # Function to create a download link for text
    def get_download_link(text, filename="file_contents.txt"):
        b64 = base64.b64encode(text.encode()).decode()
        href = f'<a href="data:file/txt;base64,{b64}" download="{filename}">Download all contents as text file</a>'
        return href
    
    # Display combined content in an expandable box
    with st.expander("View All Contents", expanded=True):
        st.text_area("Combined Contents", all_content, height=400)
    
    # Copy buttons
    col1, col2 = st.columns(2)
    
    with col1:
        # Using a workaround for clipboard copy with JavaScript
        st.markdown(
            """
            <script>
            function copyToClipboard(text) {
                navigator.clipboard.writeText(text).then(function() {
                    alert('Copied to clipboard!');
                }, function() {
                    alert('Failed to copy to clipboard');
                });
            }
            </script>
            """,
            unsafe_allow_html=True
        )
        
        # Create a button that uses Javascript to copy to clipboard
        copy_button_html = f'''
        <button 
            onclick="copyToClipboard(`{all_content.replace('`', '\\`').replace("'", "\\'")}`)" 
            style="background-color:#4CAF50;color:white;padding:10px 24px;border:none;border-radius:4px;cursor:pointer;">
            Copy All Contents to Clipboard
        </button>
        '''
        st.markdown(copy_button_html, unsafe_allow_html=True)
        
        # Alternative method - just in case the JavaScript doesn't work in Streamlit
        st.text("If the copy button doesn't work, use the text area above to manually select and copy content")
    
    with col2:
        st.markdown(get_download_link(all_content), unsafe_allow_html=True)
    
    # Display individual files
    st.header("Individual Files")
    for file_name, content in st.session_state.file_contents.items():
        with st.expander(f"{file_name}"):
            st.text_area(f"Content of {file_name}", content, height=200)