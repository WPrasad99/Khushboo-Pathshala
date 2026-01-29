import PyPDF2

def extract_text(pdf_path):
    try:
        reader = PyPDF2.PdfReader(pdf_path)
        text = ""
        for page in reader.pages:
            extracted = page.extract_text() or ""
            # Clean up text - replace problematic characters
            extracted = extracted.encode('ascii', 'replace').decode('ascii')
            text += extracted + "\n\n"
        return text
    except Exception as e:
        return f"Error: {e}"

# Extract both PDFs
tech_text = extract_text(r"c:\Users\Pratamesh\OneDrive\Desktop\New folder\Khushboo-Pathshala\Technology_Specification.pdf")
features_text = extract_text(r"c:\Users\Pratamesh\OneDrive\Desktop\New folder\Khushboo-Pathshala\Product_Features Specification.pdf")

# Write to file
with open("pdf_content.txt", "w", encoding="utf-8") as f:
    f.write("=" * 80 + "\n")
    f.write("TECHNOLOGY SPECIFICATION\n")
    f.write("=" * 80 + "\n\n")
    f.write(tech_text)
    f.write("\n\n\n")
    f.write("=" * 80 + "\n")
    f.write("PRODUCT FEATURES SPECIFICATION\n")
    f.write("=" * 80 + "\n\n")
    f.write(features_text)

print("Content written to pdf_content.txt")
