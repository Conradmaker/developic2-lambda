const AWS = require("aws-sdk");
const sharp = require("sharp");

const s3 = new AWS.S3();
const transforms = [
    { name: "200", width: 200 },
    { name: "400", width: 400 },
    { name: "600", width: 600 }
  ];

exports.handler = async (event, context, callback) => {
  const Bucket = event.Records[0].s3.bucket.name; //developic2
  const Key = decodeURIComponent(event.Records[0].s3.object.key);
  console.log('Bucket:',Bucket,'Key:', Key);

  const filename = Key.split("/")[Key.split("/").length - 1];
  const kind = Key.split("/")[1];
  const ext = Key.split(".")[Key.split(".").length - 1].toLowerCase();
  const requiredFormat = ext === "jpg" ? "jpeg" : ext;
  console.log("파일명(filename):", filename, "ext:", ext);


  try {
    const s3Object = await s3.getObject({Bucket, Key}).promise();
    console.log("원본용량(original)", s3Object.Body.length);

    await Promise.all(
    transforms.map(async item=>{
        const resizedImg = await sharp(s3Object.Body)
                                    .resize({width:item.width})
                                    .toFormat(requiredFormat)
                                    .toBuffer();

        console.log(`변환완료: width:${item.width},src:${`resize/${item.name}/${filename}`} image: ${resizedImg.length}`);

        return await s3.putObject({Bucket,Key:`resize/${item.name}/${kind}/${filename}`,Body:resizedImg }).promise()
    })
)


    return callback(null, Key);
  } catch (e) {
    console.error(e);
    return callback(e);
  }
};
