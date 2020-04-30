// for node (get these in browser):
if (typeof btoa === "undefined") {
    function btoa(someBinary) {
        return Buffer.from(someBinary, "binary").toString("base64");
    }

    function atob(someText) {
        return Buffer.from(someText, "base64").toString('binary')
    }
}

function b64ToUint8Array(srcBase64) {
    const rawBinary = atob(srcBase64);
    const destBin = new Uint8Array(rawBinary.length);
    for (let i = 0 ; i < rawBinary.length ; ++i) {
        destBin[i] = rawBinary.charCodeAt(i);
    }
    return destBin;
}


function zeroPad(num, digits) {
    num = String(num);
    if (num.length < digits) {
        const numPad = digits - num.length;
        const pad = Array(numPad + 1).join("0");
        return pad + num;
    } else {
        return num;
    }
}

function dumpQuads(srcCode) {
    if (srcCode.length % 4 !== 0) {
        throw Exception("Invalid length srcCode");
    }

    const numQuads = srcCode.length / 4;
    for (let i = 0 ; i < srcCode.length ; i = i + 4) {
        var b = (srcCode[i] << 24) + (srcCode[i+1] << 16) + (srcCode[i+2] << 8) + srcCode[i+3];
        var c = (srcCode[i+3] * (2**24)) + (srcCode[i+2] << 16) + (srcCode[i+1] << 8) + srcCode[i];
        var result = b.toString(16);
        if (b < 0) {
            // need twos complement, << assumes signed32 arithmetic
            stuff = (srcCode[i] * (2**24)) + (srcCode[i+1] << 16) + (srcCode[i+2] << 8) + srcCode[i+3];
            result = stuff.toString(16);
        }
        result = zeroPad(result, 8);
        resultBinary = zeroPad(parseInt(result, 16).toString("2"), 32);
        resultBinaryBack = zeroPad(c.toString("2"), 32);
        console.log(result, resultBinary, resultBinaryBack);
    }
}

function formatBinary(src, totalSize) {
    var temp = zeroPad(src.toString(2), totalSize);
    var t2 = "";

    var j = 0;
    for (var i = temp.length - 1 ; i >= 0 ; --i) {
        t2 = temp[i] + t2;
        j += 1;
        if (j % 4 == 0) {
            t2 = " " + t2;
        }
    }

    return t2;
}

// slow routines for operand decoding
function getRd(instruction) {
    const rdMask = 0b00000000000000000000111110000000;
    const rd = (rdMask & instruction) >>> 7;
    return rd;
}

function getRs1(instruction) {
    //const mask = 0b0000 0000 0000 0000 0000 0000 0000 0000;
    const mask = 0b00000000000011111000000000000000;
    return (mask & instruction) >>> 15;
}

function getRs2(instruction) {
    //const mask = 0b0000 0000 0000 0000 0000 0000 0000 0000;
    const mask = 0b00000001111100000000000000000000;
    return (mask & instruction) >>> 20;
}

function getFunct3(instruction) {
    //const mask = 0b0000 0000 0000 0000 0000 0000 0000 0000;
    const mask = 0b00000000000000000111000000000000;
    return (mask & instruction) >>> 12;
}

// TODO: untested for 32bit numbers or greater
function twosComplement(num, bits) {
    if (bits >= 32) {
        console.error("UNTESTED FOR 32bit or greater numbers!");
        process.exit(2);
    }
    result = -((1<<bits) - num);
    return result;
}

// only do twos complement if high bit is set
function treatAsSigned(num, bits) {
    let result = num;
    if ((num & (1 << (bits-1))) > 0) {
        result = twosComplement(num, bits);
    }
    return result;
}

function getITypeImm(instruction) {
    const mask = 0b11111111111100000000000000000000;
    let imm = treatAsSigned((mask & instruction) >>> 20, 12);
    // to get 1 in the highest 12 bit, shift it 11
    return imm;
}

function getSTypeImm11(instruction) {
    const mask = 0b11111110000000000000000000000000;
    const imm = (mask & instruction) >>> 25;
    return imm;
}

function getUTypeImm31(instruction) {
    const mask = 0b11111111111111111111000000000000;
    const imm = (mask & instruction) >>> 12;
    return imm;
}


// R / S / B have the same fields, different semantics
function decodeRSBTypes(inst) {
    const sTypeImm4 = getRd(inst);  // they overlap
    const funct3 = getFunct3(inst);
    const rs1 = getRs1(inst);
    const rs2 = getRs2(inst);
    const sTypeImm11 = getSTypeImm11(inst);
    return [sTypeImm4, funct3, rs1, rs2, sTypeImm11];
}

function decodeUJTypes(inst) {
    const rd = getRd(inst);
    const imm31 = getUTypeImm31(inst);
    return [rd, imm31];
}

// crappy zip operator
function renameParts(names, parts) {
    const result = {};

    for (var i = 0 ; i < names.length ; ++i) {
        result[names[i]] = parts[i];
    }

    return result;
}


function handleRType(inst, opcode) {
    //const [rd, funct3, rs1, rs2, funct7] = decodeRSBTypes(inst);
    const names = ["rd", "funct3", "rs1", "rs2", "funct7"];
    const parts = decodeRSBTypes(inst);
    const result = renameParts(names, parts);
    //console.log("  R type: ", result);
    return result;
}

function handleIType(inst, opcode) {
    const rd = getRd(inst);
    const funct3 = getFunct3(inst);
    const rs1 = getRs1(inst);
    const iTypeImm = getITypeImm(inst);
    const result = { "rd": rd, "funct3": funct3, "rs1": rs1, "imm11": iTypeImm};
    //console.log("  it's I type: rd:" + formatBinary(rd, 5) + " imm:" + formatBinary(iTypeImm, 12) + " rs1: " + formatBinary(rs1, 5) + " funct3: " + formatBinary(funct3, 3));
    //console.log("  I type:", result);
    return result;
}

// R / S / B have the same fields, different semantics
function handleSType(inst, opcode) {
    const names = ["imm4", "funct3", "rs1", "rs2", "imm11"];
    const parts = decodeRSBTypes(inst);
    const result = renameParts(names, parts);
    result["imm"] = treatAsSigned((result["imm11"] << 5) + result["imm4"], 12);
    //console.log("  S type: ", result);
    return result;
}

// R / S / B have the same fields, different semantics
function handleBType(inst, opcode) {
    const names = ["imm4", "funct3", "rs1", "rs2", "imm12"];
    const parts = decodeRSBTypes(inst);
    const result = renameParts(names, parts);
    //console.log("  B type: ", result);
    return result;
}

function handleUType(inst, opcode) {
    const names = ["rd", "imm31"];
    const parts = decodeUJTypes(inst);
    const result = renameParts(names, parts);
    //console.log("  U type:", result);
    return result;
}

function handleJType(inst, opcode) {
    const names = ["rd", "imm20"];
    const parts = decodeUJTypes(inst);
    const result = renameParts(names, parts);
    //bits 31..12 (imm20) are: imm[20], imm[10:1], imm[11], imm[19:12]

    const rawAddr = result["imm20"];
    const imm20value = (rawAddr >>> 19);

    const imm10to1mask =  0b01111111111000000000;
    const imm11mask =     0b00000000000100000000;
    const imm19to12mask = 0b00000000000011111111;

    const imm10to1value = (rawAddr & imm10to1mask) >> 9;
    const imm11value = (rawAddr & imm11mask) >> 8;
    const imm19to12value = (rawAddr & imm19to12mask);
    const imm = (imm20value << 19) + (imm19to12value << 11) + (imm11value << 10) + (imm10to1value);

    /* var a = [formatBinary(rawAddr,20),
        " " + imm20value,
        " " + formatBinary(imm19to12value, 8),
        Array(12).join(" ") + formatBinary(imm11value, 1),
        Array(13).join(" ") + formatBinary(imm10to1value, 8),
        formatBinary(imm, 20),
        treatAsSigned(imm, 20)
        ]; */
    // TODO: Start here - finish verifying the jump address address
    result["imm"] = treatAsSigned(imm, 20);

    //console.log("  J type:", result, "\n", a.join("\n"));
    //console.log(a.join("\n"));
    return result;
}

function handleNopType(inst, opcode) {
    //console.log("  Not decoding nop operands");
    return {};
}


function decodeRV32i(log, bin) {
    // with rv32i all instructions are 4bytes, 1..0 == 011 and 4..2 != 0111
    // TODO: Improperly assuming code is valid :(
    //dumpQuads(bin);

    if (bin.length % 4 !== 0) {
        throw Exception("Invalid length bin");
    }

    // put lsb on left
    var howMany = 3;
    for (let i = 0 ; i < bin.length ; i = i + 4) {
        let opcode = "UNK";
        const inst = (bin[i+3] * (2**24)) + (bin[i+2] << 16) + (bin[i+1] << 8) + bin[i];
        const instHex = zeroPad(inst.toString(16), 8);
        //const instBin = zeroPad(inst.toString(2), 32);
        //log(instHex, formatBinary(instBin));
        //const mask = 0b0010011;
        const mask = 0b1111111;
        const last7bits = inst & mask;  // take the last 7 bits
        const next3IBits = (inst & 0b111000000000000) >> 12;
        if (false) {
        } else if (last7bits === 0b0110111) {   // Don't use next3IBits
            opcode = "lui";
        } else if (last7bits === 0b0010111) {
            opcode = "auipc";
        } else if (last7bits === 0b1101111) {
            opcode = "jal";
        } else if (last7bits === 0b1100111) {   // Rest all use next3IBits
            opcode = ["jalr"][next3IBits];
            //          000
        } else if (last7bits === 0b1100011) {
            opcode = ["beq", "bne", "BAD", "BAD", "blt", "bge", "bltu", "bgeu"][next3IBits];
            //         000    001                  100    101     110     111
        } else if (last7bits === 0b0000011) {
            opcode = ["lb", "lh", "lw", "BAD", "lbu", "lhu"][next3IBits];
            //         000   001   010          100    101
        } else if (last7bits === 0b0100011) {
            opcode = ["sb", "sh", "sw"][next3IBits];
            //         000   001   010
        } else if (last7bits === 0b0010011) {
            opcode = ["addi", "slli", "slti", "sltiu", "xori", "srli/srai", "ori", "andi"][next3IBits];
            //          000     001     010      011     100     101         110     111
            // srli and srai share next3IBits, differentiate with funct7 31..25
            if (next3IBits === 0b101) {
                // last bit causes sign math
                const funct7 = parseInt(zeroPad(inst.toString(2), 32).slice(0, 7), 2);
                if (funct7 === 0b0000000) {
                    opcode = "srli";
                } else if (funct7 === 0b0100000) {
                    opcode = "srai";
                } else {
                    opcode = "BADsrli/srai";
                }
            }
        } else if (last7bits === 0b0110011) {
            opcode = ["add/sub", "sll", "slt", "sltu", "xor", "srl/sra",
            //             000    001    010     011    100        101
                       "or", "and"][next3IBits];
            //          110   111
            if (next3IBits === 0b000) {
                const funct7 = parseInt(zeroPad(inst.toString(2), 32).slice(0, 7), 2);
                if (funct7 === 0b0000000) {
                    opcode = "add";
                } else if (funct7 === 0b0100000) {
                    opcode = "sub";
                } else {
                    opcode = "BADadd/sub";
                }
            } else if( next3IBits === 0b101) {
                const funct7 = parseInt(zeroPad(inst.toString(2), 32).slice(0, 7), 2);
                if (funct7 === 0b0000000) {
                    opcode = "srl";
                } else if (funct7 === 0b0100000) {
                    opcode = "sra";
                } else {
                    opcode = "BADsrl/sra";
                }
            }
        } else if (last7bits === 0b0001111) {
            opcode = "fence";
        } else if (last7bits === 0b1110011) {
            opcode = "ecall/ebreak (or csr)";
            const funct7andrs2 = parseInt(zeroPad(inst.toString(2), 32).slice(0, 12), 2);
            if (funct7andrs2 === 0b000000000000) {
                opcode = "ecall";
            } else if (funct7andrs2 === 0b000000000001) {
                opcode = "ebreak";
            } else {
                // CSR from Zicsr standard extension are here
                //opcode = "BADecall/ebreak";
                // Treat these as NOP/UNK
                opcode = "UNK";
            }
        }

        const instTypes = {"add": "R", "sub": "R", "sll": "R", "slt": "R", "sltu": "R", "xor": "R", "srl": "R", "sra": "R", "or": "R", "and": "R",
            "jalr": "I", "lb": "I", "lh": "I", "lw": "I", "lbu": "I", "lhu": "I", "addi": "I", "slti": "I", "sltiu": "I", "xori": "I", "ori": "I", "andi": "I",
            // These are a little odd:
            "slli": "I", "srli": "I", "srai": "I",
            // ecall and ebreak are basically I-type, but rd/rs1/imm11 are constant
            "ecall": "I", "ebreak": "I",
            "sb": "S", "sh": "S", "sw": "S",
            // B type is really S type syntax with different semantics
            "beq": "B", "bne": "B", "blt": "B", "bge": "B", "bltu": "B", "bgeu": "B",
            "lui": "U", "auipc": "U",
            // J type is really U type syntax with different semantics
            "jal": "J",
            // Creating a nop-type, ignore operands
            "fence": "N", "UNK": "N"
            };


        const operandDecoderMap = {
            "R": handleRType,
            "I": handleIType,
            "S": handleSType,
            "B": handleBType,
            "U": handleUType,
            "J": handleJType,
            "N": handleNopType
        };

        //log(instHex, formatBinary(instBin, 32), "  opcode: " + opcode + ", next3: " + formatBinary(next3IBits, 3));
        if (opcode in instTypes) {
            const decodedType = instTypes[opcode];
            result = operandDecoderMap[decodedType](inst, opcode);
            log(instHex, opcode + "." + decodedType, "\t", result);
        } else {
            log(instHex, "TRAP", "", "unknown");
        }
    }
}


// TODO: read the elf header
// for now, node/exec only, leaves the result in binaryFile
function stripElfHeader(srcFile, binaryFile) {
    // Strip the elf, just pull the text segment:
    const cmd = `riscv32-unknown-elf-objcopy -O binary ${srcFile} ${binaryFile}`;
    //console.log(cmd);
    require("child_process").execSync(cmd);
}

// node only
function readBinaryFile(binaryFile) {
    const fs = require("fs");
    const arrayBuf = new Uint8Array(fs.readFileSync(binaryFile));
    return arrayBuf;
}

function main() {
    const staticPrograms = [
        "EwEB/iMugQATBAECIyak/iMktP6TBwAAE4UHAAMkwQETAQECZ4AAAA==",
        ["bwDAAG8AAAZvAIADDwDwD3MQJHtzJEDxIyCAEANEBEATdBQAYxQEAnMkQPEDRARAE3QkAGMYBAJz",
        "AFAQb/Cf/XMkIHsjJgAQcwAQAHMkQPEjIoAQcyQgew8A8A8PEAAAZwAAMHMkQPEjJIAQcyQge3MA",
        "IHs="].join("\n")];
    //const srcFile = "../riscv-compliance/work/I-ADD-01.elf";
    //const srcFile = "../selfie/selfie";
    //const binaryFile = "/tmp/rv.bin";
    //stripElfHeader(srcFile, binaryFile);
    //const binaryFile = "../riscv-compliance/work/I-XORI-01.bin";
    //const binaryFile = "vmlinux.bin";

    //const compiledBin = readBinaryFile(binaryFile);
    const compiledBin = b64ToUint8Array(staticPrograms[0]);

    decodeRV32i(console.log, compiledBin);
}

//main();
