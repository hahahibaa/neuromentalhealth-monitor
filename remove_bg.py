from PIL import Image

def make_transparent(input_path, output_path, tolerance=30):
    img = Image.open(input_path)
    img = img.convert("RGBA")
    datas = img.getdata()

    # Get the background color from the top-left pixel
    bg_color = datas[0]
    
    newData = []
    for item in datas:
        # Check if the pixel color is within the tolerance of the background color
        if (abs(item[0] - bg_color[0]) < tolerance and 
            abs(item[1] - bg_color[1]) < tolerance and 
            abs(item[2] - bg_color[2]) < tolerance):
            # Replace with transparent pixel
            newData.append((255, 255, 255, 0))
        else:
            newData.append(item)

    img.putdata(newData)
    img.save(output_path, "PNG")

if __name__ == "__main__":
    make_transparent("bg.png", "bg_transparent.png")
