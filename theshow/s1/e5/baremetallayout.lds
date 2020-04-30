/* setting arch on gcc -march, passthrough */
/* OUTPUT_ARCH("riscv") */
/* ENTRY( _start ) */
/* start = 0x200; */

SECTIONS
{
    /* text: test code section */
    . = 0x200;

    /* .text : { start = .; *(.text) } */
    .text : { *(.text) }

    /* data: Initialized data segment */
    .data : { *(.data) }

    /* End of uninitalized data segement */
    _end = .;
}
